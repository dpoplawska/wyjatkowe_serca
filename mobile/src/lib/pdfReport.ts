import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// Legacy FS API has the simple moveAsync / cacheDirectory helpers we need
// to rename the print output. The new SDK 54 file-system API is more
// involved (object-oriented File handles) and offers no benefit here.
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import { makeApi, TokenProvider } from '../api/client';
import {
  PatientProfileData,
  Lek,
  MeasurementEntry,
  InrEntry,
} from '../types/api';
import { frequencyLabel, normalizeHistory, CZAS_TRWANIA_LABELS, isDone } from './medications';

// PDF generation. expo-print runs the HTML through the platform's native print
// engine (WebView/WKWebView for iOS, Android print framework for Android), so
// any standard HTML+SVG+CSS works. We render charts as inline SVG to avoid the
// view-shot dependency and keep the report self-contained — the same data is
// re-drawn in the document rather than screenshotted from the screen.

const BRAND_RED = '#EC1A3B';
const BRAND_BLUE = '#2383C5';
const GREY1 = '#2E2E2E';
const GREY2 = '#616161';
const GREY_BORDER = '#e5e7eb';
const GREY_BG = '#f8f9fa';
const SUCCESS_BG = '#dcfce7';

function esc(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

function fmtDate(iso: string): string {
  return iso ? dayjs(iso).format('DD.MM.YYYY') : '';
}

function fmtDateTime(iso: string): string {
  return iso ? dayjs(iso).format('DD.MM.YYYY HH:mm') : '';
}

function fmtShort(iso: string): string {
  return iso ? dayjs(iso).format('DD.MM HH:mm') : '';
}

function yesNo(v: boolean): string {
  return v ? 'Tak' : 'Nie';
}

interface Sample { value: number; ts: number; label: string }

interface Series { name: string; color: string; samples: Sample[] }

interface ChartOpts {
  yMin?: number;
  yMax?: number;
  goodBand?: { min: number; max: number };
  unit?: string;
  height?: number;
}

// Renders one or more series as an inline SVG line chart. Width is set via
// CSS to 100% of the container; height is fixed so layout is predictable.
function svgChart(series: Series[], opts: ChartOpts = {}): string {
  const points = series.flatMap((s) => s.samples);
  if (points.length === 0) {
    return `<div class="chart-empty">Brak danych</div>`;
  }
  const W = 540, H = opts.height ?? 96;
  const padL = 36, padR = 12, padT = 8, padB = 20;
  const cw = W - padL - padR;
  const ch = H - padT - padB;

  const values = points.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  // Pad the range a bit so the line isn't flush against the top/bottom of the box.
  const span = Math.max(dataMax - dataMin, 1);
  const yMin = opts.yMin ?? dataMin - span * 0.1;
  const yMax = opts.yMax ?? dataMax + span * 0.1;
  const yRange = Math.max(yMax - yMin, 1);

  const allTs = points.map((p) => p.ts);
  const tMin = Math.min(...allTs);
  const tMax = Math.max(...allTs);
  const tRange = Math.max(tMax - tMin, 1);

  const x = (t: number) => padL + ((t - tMin) / tRange) * cw;
  const y = (v: number) => padT + ch - ((v - yMin) / yRange) * ch;

  // Therapeutic / "good" band, drawn behind the data.
  const band = opts.goodBand
    ? `<rect x="${padL}" y="${y(opts.goodBand.max).toFixed(1)}" width="${cw}" height="${(y(opts.goodBand.min) - y(opts.goodBand.max)).toFixed(1)}" fill="${SUCCESS_BG}" opacity="0.5"/>`
    : '';

  // Y-axis: 4 gridlines + labels.
  const yTicks = [0, 0.33, 0.66, 1]
    .map((p) => {
      const v = yMin + p * yRange;
      const yp = padT + ch - p * ch;
      return `<line x1="${padL}" y1="${yp.toFixed(1)}" x2="${W - padR}" y2="${yp.toFixed(1)}" stroke="#f0f0f0"/>
              <text x="${padL - 4}" y="${(yp + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="${GREY2}">${v.toFixed(yRange < 10 ? 1 : 0)}</text>`;
    })
    .join('');

  // X-axis: evenly-spaced date ticks across the timestamp range. Format
  // depends on the span — short ranges show day+month, longer ones show
  // month+year so labels don't all collapse to the same string.
  const spanDays = (tMax - tMin) / 86_400_000;
  const fmtTick = (ts: number) => {
    const d = dayjs(ts);
    if (spanDays <= 730) return d.format('DD.MM');
    return d.format('DD.MM.YY');
  };
  const tickFractions = [0, 0.25, 0.5, 0.75, 1];
  const xLabels = tickFractions
    .map((p, i) => {
      const ts = tMin + p * tRange;
      const xp = padL + p * cw;
      const anchor = i === 0 ? 'start' : i === tickFractions.length - 1 ? 'end' : 'middle';
      return `<text x="${xp.toFixed(1)}" y="${(H - 4).toFixed(1)}" text-anchor="${anchor}" font-size="9" fill="${GREY2}">${esc(fmtTick(ts))}</text>`;
    })
    .join('');

  const lines = series
    .map((s) => {
      if (s.samples.length === 0) return '';
      const pts = s.samples.map((p) => `${x(p.ts).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
      const dots = s.samples
        .map((p) => `<circle cx="${x(p.ts).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="2" fill="${s.color}"/>`)
        .join('');
      return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="1.6"/>${dots}`;
    })
    .join('');

  // Legend (only when more than one series).
  const legend =
    series.length > 1
      ? `<div class="legend">${series
          .map((s) => `<span><span class="dot" style="background:${s.color}"></span>${esc(s.name)}</span>`)
          .join('')}</div>`
      : '';

  return `<div class="chart">
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${band}${yTicks}${lines}${xLabels}
    </svg>
    ${legend}
  </div>`;
}

function statsLine(values: number[], unit = ''): string {
  if (values.length === 0) return '<span class="muted">brak danych</span>';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return `min <b>${min.toFixed(unit === '' && Number.isInteger(min) ? 0 : 1)}${unit}</b> · max <b>${max.toFixed(unit === '' && Number.isInteger(max) ? 0 : 1)}${unit}</b> · śr. <b>${avg.toFixed(1)}${unit}</b> · ${values.length} pomiarów`;
}

function pickSamples<T extends { date: string }>(entries: T[], field: keyof T): Sample[] {
  return entries
    .filter((e) => typeof e[field] === 'number' && (e[field] as unknown) !== null)
    .map((e) => ({
      value: e[field] as unknown as number,
      ts: new Date(e.date).getTime(),
      label: dayjs(e.date).format('DD.MM'),
    }))
    .sort((a, b) => a.ts - b.ts);
}

function renderProfile(p: PatientProfileData): string {
  const ops = p.przebyte_operacje ?? [];
  const wady = p.wada_serca ?? [];
  return `
    <h2>Profil pacjenta</h2>
    <div class="grid-2">
      ${row('Imię i nazwisko', p.imie_nazwisko)}
      ${row('Grupa krwi', p.grupa_krwi)}
    </div>

    ${wady.length > 0 ? `<h3>Wady serca</h3><ul class="tight">${wady.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}

    <h3>Zaburzenia rytmu</h3>
    <div class="grid-2">
      ${row('Występują', yesNo(p.zaburzenia_rytmu))}
      ${p.zaburzenia_rytmu ? row('Typ', p.zaburzenia_rytmu_typ) : ''}
    </div>
    ${p.zaburzenia_rytmu && p.zaburzenia_rytmu_opis ? `<p class="note">${esc(p.zaburzenia_rytmu_opis)}</p>` : ''}

    <h3>Rozrusznik serca</h3>
    <div class="grid-2">
      ${row('Wszczepiony', yesNo(p.rozrusznik_serca))}
      ${p.rozrusznik_serca ? row('Typ', p.rozrusznik_serca_typ) : ''}
    </div>

    <h3>Powikłania</h3>
    <div class="grid-2">${row('Występują', yesNo(p.powiklania))}</div>
    ${p.powiklania && p.powiklania_opis ? `<p class="note">${esc(p.powiklania_opis)}</p>` : ''}

    <h3>Dodatkowe choroby</h3>
    <div class="grid-2">${row('Występują', yesNo(p.dodatkowe_choroby))}</div>
    ${p.dodatkowe_choroby && p.dodatkowe_choroby_opis ? `<p class="note">${esc(p.dodatkowe_choroby_opis)}</p>` : ''}

    <h3>Zespoły genetyczne</h3>
    <div class="grid-2">
      ${row('Występują', yesNo(p.zespoly_genetyczne))}
      ${p.zespoly_genetyczne ? row('Typ', p.zespoly_genetyczne_typ) : ''}
    </div>
    ${p.zespoly_genetyczne && p.zespoly_genetyczne_opis ? `<p class="note">${esc(p.zespoly_genetyczne_opis)}</p>` : ''}

    ${
      ops.length > 0
        ? `<h3>Przebyte operacje</h3>
           <table class="data">
             <thead><tr><th style="width:55%">Typ</th><th>Data</th><th>Czas pobytu OIT</th></tr></thead>
             <tbody>${ops.map((o) => `<tr><td>${esc(o.typ)}</td><td>${esc(fmtDate(o.data))}</td><td>${esc(o.czas_it)}</td></tr>`).join('')}</tbody>
           </table>`
        : ''
    }
  `;
}

function row(label: string, value: string | number | null | undefined): string {
  return `<div class="row"><div class="label">${esc(label)}</div><div class="value">${esc(value) || '<span class="muted">—</span>'}</div></div>`;
}

function renderMedications(leki: Lek[]): string {
  if (leki.length === 0) {
    return `<h2>Leki</h2><p class="muted">Brak leków na liście.</p>`;
  }
  const active = leki.filter((l) => !isDone(l));
  const finished = leki.filter((l) => isDone(l));

  const cardOf = (lek: Lek): string => {
    const history = [...lek.historia_dawek].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    const total = history.length;
    const last = history[0]?.at;
    const first = history[history.length - 1]?.at;
    const recent = history.slice(0, 5);
    const recentLine = recent
      .map((e) => `${fmtShort(e.at)}${e.dawka ? ` (${esc(e.dawka)})` : ''}`)
      .join(' · ');

    const status = isDone(lek)
      ? `<span class="badge badge-grey">Zakończony</span>`
      : lek.sledzenie
        ? `<span class="badge badge-blue">Aktywny</span>`
        : `<span class="badge badge-grey">Nieśledzony</span>`;

    return `<div class="med-card">
      <div class="med-head">
        <div class="med-name">${esc(lek.nazwa || 'bez nazwy')}</div>
        ${status}
      </div>
      <div class="med-meta">
        ${lek.dawka ? `Dawka: <b>${esc(lek.dawka)}</b> · ` : ''}
        ${lek.czestotliwosc ? `${esc(frequencyLabel(lek.czestotliwosc))} · ` : ''}
        ${lek.czas_trwania_typ ? `${esc(CZAS_TRWANIA_LABELS[lek.czas_trwania_typ] ?? lek.czas_trwania_typ)}${lek.czas_trwania_wartosc ? ` (${lek.czas_trwania_wartosc})` : ''}` : ''}
      </div>
      ${
        total > 0
          ? `<div class="med-stats">
               <span>Pierwsza: <b>${esc(fmtDate(first))}</b></span>
               <span>Ostatnia: <b>${esc(fmtDateTime(last))}</b></span>
               <span>Łącznie: <b>${total}</b> ${total === 1 ? 'podanie' : total < 5 ? 'podania' : 'podań'}</span>
             </div>
             <div class="med-recent"><span class="med-recent-label">Ostatnie:</span> ${recentLine}${total > 5 ? ` · <span class="muted">… +${total - 5}</span>` : ''}</div>`
          : '<div class="med-recent muted">Brak zapisanych podań.</div>'
      }
    </div>`;
  };

  return `<h2>Leki</h2>
    ${active.length > 0 ? active.map(cardOf).join('') : ''}
    ${finished.length > 0 ? `<h3>Zakończone</h3>${finished.map(cardOf).join('')}` : ''}
  `;
}

function renderMeasurements(entries: MeasurementEntry[]): string {
  if (entries.length === 0) {
    return `<h2>Pomiary</h2><p class="muted">Brak zapisanych pomiarów.</p>`;
  }
  // Sort newest-first for the table, oldest-first for charts.
  const desc = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // Charts are bounded to the last 6 months so older outliers don't squash
  // the y-axis and the time-density stays readable. The recent-entries
  // table below uses the full history.
  const sixMonthsAgo = Date.now() - 180 * 86_400_000;
  const chartEntries = entries.filter((e) => new Date(e.date).getTime() >= sixMonthsAgo);
  const sat = pickSamples(chartEntries, 'saturacja');
  const tet = pickSamples(chartEntries, 'tetno');
  const sys = pickSamples(chartEntries, 'cisnienie_skurczowe');
  const dia = pickSamples(chartEntries, 'cisnienie_rozkurczowe');
  const diu = pickSamples(chartEntries, 'diureza');

  const recent = desc.slice(0, 30);
  const rest = desc.length - recent.length;

  return `<h2>Pomiary</h2>
    <p class="muted small">Wykresy: ostatnie 6 miesięcy.</p>

    <div class="chart-card">
      <div class="chart-title">Tętno <span class="muted">/min</span></div>
      ${svgChart([{ name: 'Tętno', color: BRAND_RED, samples: tet }], { goodBand: { min: 60, max: 100 } })}
      <div class="chart-stats">${statsLine(tet.map((s) => s.value))}</div>
    </div>
    <div class="chart-card">
      <div class="chart-title">Saturacja <span class="muted">%</span></div>
      ${svgChart([{ name: 'Saturacja', color: BRAND_BLUE, samples: sat }], { yMin: 80, yMax: 100, goodBand: { min: 95, max: 100 } })}
      <div class="chart-stats">${statsLine(sat.map((s) => s.value), '%')}</div>
    </div>
    <div class="chart-card">
      <div class="chart-title">Ciśnienie <span class="muted">mmHg</span></div>
      ${svgChart(
        [
          { name: 'Skurczowe', color: BRAND_RED, samples: sys },
          { name: 'Rozkurczowe', color: BRAND_BLUE, samples: dia },
        ],
        { goodBand: { min: 60, max: 140 } },
      )}
      <div class="chart-stats">${sys.length > 0 ? `sk. ${statsLine(sys.map((s) => s.value))}<br/>roz. ${statsLine(dia.map((s) => s.value))}` : '<span class="muted">brak danych</span>'}</div>
    </div>
    <div class="chart-card">
      <div class="chart-title">Diureza <span class="muted">ml</span></div>
      ${svgChart([{ name: 'Diureza', color: '#7c3aed', samples: diu }])}
      <div class="chart-stats">${statsLine(diu.map((s) => s.value), ' ml')}</div>
    </div>

    <h3>Ostatnie pomiary${rest > 0 ? ` <span class="muted">(${recent.length} z ${desc.length})</span>` : ''}</h3>
    <table class="data">
      <thead>
        <tr>
          <th>Data</th>
          <th>Tętno</th>
          <th>SpO₂</th>
          <th>Ciśnienie</th>
          <th>Diureza</th>
          <th>Uwagi</th>
        </tr>
      </thead>
      <tbody>
        ${recent
          .map((e) => {
            const cis =
              e.cisnienie_skurczowe != null && e.cisnienie_rozkurczowe != null
                ? `${e.cisnienie_skurczowe}/${e.cisnienie_rozkurczowe}`
                : '';
            return `<tr>
              <td>${esc(fmtDateTime(e.date))}</td>
              <td>${e.tetno ?? ''}</td>
              <td>${e.saturacja ?? ''}</td>
              <td>${esc(cis)}</td>
              <td>${e.diureza ?? ''}</td>
              <td>${esc(e.note ?? '')}</td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>
    ${rest > 0 ? `<p class="muted small">Pominięto ${rest} starszych pomiarów (zobacz wykresy powyżej dla pełnego obrazu).</p>` : ''}
  `;
}

function renderInr(entries: InrEntry[]): string {
  if (entries.length === 0) {
    return `<h2>INR</h2><p class="muted">Brak zapisanych pomiarów INR.</p>`;
  }
  const desc = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sixMonthsAgo = Date.now() - 180 * 86_400_000;
  const samples: Sample[] = entries
    .filter((e) => new Date(e.date).getTime() >= sixMonthsAgo)
    .map((e) => ({
      value: e.inr,
      ts: new Date(e.date).getTime(),
      label: dayjs(e.date).format('DD.MM'),
    }))
    .sort((a, b) => a.ts - b.ts);

  const recent = desc.slice(0, 30);
  const rest = desc.length - recent.length;

  return `<h2>INR</h2>
    <p class="muted small">Wykres: ostatnie 6 miesięcy.</p>
    <div class="chart-card">
      <div class="chart-title">Pomiary INR <span class="muted">(zakres terapeutyczny 2,0 – 3,5)</span></div>
      ${svgChart([{ name: 'INR', color: BRAND_BLUE, samples }], { yMin: 0.5, yMax: 5, goodBand: { min: 2, max: 3.5 }, height: 120 })}
      <div class="chart-stats">${statsLine(samples.map((s) => s.value))}</div>
    </div>

    <h3>Ostatnie pomiary${rest > 0 ? ` <span class="muted">(${recent.length} z ${desc.length})</span>` : ''}</h3>
    <table class="data">
      <thead><tr><th>Data</th><th>INR</th><th>PT</th><th>PT norm.</th><th>ISI</th><th>Uwagi</th></tr></thead>
      <tbody>
        ${recent
          .map(
            (e) => `<tr>
              <td>${esc(fmtDate(e.date))}</td>
              <td><b>${esc(e.inr)}</b></td>
              <td>${esc(e.pt)}</td>
              <td>${esc(e.pt_normal)}</td>
              <td>${esc(e.isi)}</td>
              <td>${esc(e.note ?? '')}</td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>
    ${rest > 0 ? `<p class="muted small">Pominięto ${rest} starszych pomiarów.</p>` : ''}
  `;
}

function buildHtml(args: {
  profile: PatientProfileData;
  leki: Lek[];
  measurements: MeasurementEntry[];
  inr: InrEntry[];
}): string {
  const generated = dayjs().format('DD.MM.YYYY HH:mm');
  const title = args.profile.imie_nazwisko || 'Profil pacjenta';
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8"/>
<title>${esc(title)} — raport</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: ${GREY1}; font-size: 11pt; line-height: 1.4; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid ${BRAND_BLUE}; padding-bottom: 8px; margin-bottom: 16px; }
  header h1 { font-size: 18pt; margin: 0; color: ${GREY1}; }
  header .gen { font-size: 9pt; color: ${GREY2}; }
  h2 { font-size: 14pt; color: ${BRAND_BLUE}; margin: 18px 0 8px; border-bottom: 1px solid ${GREY_BORDER}; padding-bottom: 4px; }
  h3 { font-size: 11pt; color: ${GREY1}; margin: 12px 0 6px; font-weight: 700; }
  p { margin: 4px 0; }
  ul.tight { margin: 4px 0 4px 18px; padding: 0; }
  ul.tight li { margin: 0; padding: 1px 0; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
  .row { display: flex; gap: 8px; padding: 2px 0; }
  .row .label { color: ${GREY2}; min-width: 130px; }
  .row .value { color: ${GREY1}; font-weight: 600; }
  .muted { color: ${GREY2}; }
  .small { font-size: 9pt; }
  .note { background: ${GREY_BG}; border-left: 3px solid ${GREY_BORDER}; padding: 6px 10px; margin: 4px 0; font-size: 10pt; color: ${GREY1}; }

  table.data { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 4px 0 8px; }
  table.data th { text-align: left; background: ${GREY_BG}; color: ${GREY2}; font-weight: 600; padding: 5px 6px; border-bottom: 1px solid ${GREY_BORDER}; }
  table.data td { padding: 4px 6px; border-bottom: 1px solid ${GREY_BORDER}; vertical-align: top; }
  table.data tr:nth-child(even) td { background: #fafbfc; }

  .badge { font-size: 8.5pt; padding: 2px 7px; border-radius: 9px; font-weight: 600; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-grey { background: ${GREY_BG}; color: ${GREY2}; }

  .med-card { border: 1px solid ${GREY_BORDER}; border-radius: 6px; padding: 8px 10px; margin: 6px 0; page-break-inside: avoid; }
  .med-head { display: flex; justify-content: space-between; align-items: center; }
  .med-name { font-weight: 700; font-size: 11pt; }
  .med-meta { font-size: 9.5pt; color: ${GREY2}; margin-top: 2px; }
  .med-stats { font-size: 9.5pt; color: ${GREY1}; margin-top: 4px; display: flex; gap: 14px; flex-wrap: wrap; }
  .med-recent { font-size: 9.5pt; color: ${GREY1}; margin-top: 4px; }
  .med-recent-label { color: ${GREY2}; margin-right: 4px; }

  .chart-card { border: 1px solid ${GREY_BORDER}; border-radius: 6px; padding: 8px; page-break-inside: avoid; margin-bottom: 8px; }
  .chart-title { font-size: 10pt; font-weight: 600; margin-bottom: 4px; }
  .chart-stats { font-size: 9pt; color: ${GREY1}; margin-top: 4px; }
  .chart svg { width: 100%; display: block; }
  .chart-empty { padding: 24px 0; text-align: center; color: ${GREY2}; font-size: 9pt; }
  .legend { display: flex; gap: 12px; font-size: 9pt; color: ${GREY2}; margin-top: 4px; }
  .legend .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }

  section { page-break-inside: avoid; }
  section + section { page-break-before: auto; }
</style>
</head>
<body>
  <header>
    <h1>${esc(title)}</h1>
    <div class="gen">Wygenerowano: ${esc(generated)}</div>
  </header>

  <section>${renderProfile(args.profile)}</section>
  <section>${renderMedications(args.leki)}</section>
  <section>${renderMeasurements(args.measurements)}</section>
  <section>${renderInr(args.inr)}</section>
</body>
</html>`;
}

export async function generatePatientPdf(getToken: TokenProvider): Promise<void> {
  const api = makeApi(getToken);
  // Fetch concurrently. Each endpoint may return an empty object for a fresh
  // patient — normalise to safe defaults.
  const [profileResp, medsResp, measResp, inrResp] = await Promise.all([
    api.getPatientProfile().catch(() => ({})),
    api.getMedications().catch(() => ({})),
    api.getMeasurements().catch(() => ({})),
    api.getInr().catch(() => ({})),
  ]);

  const profile = {
    imie_nazwisko: '',
    grupa_krwi: '',
    wada_serca: [],
    zaburzenia_rytmu: false,
    zaburzenia_rytmu_typ: '',
    zaburzenia_rytmu_opis: '',
    rozrusznik_serca: false,
    rozrusznik_serca_typ: '',
    przebyte_operacje: [],
    powiklania: false,
    powiklania_opis: '',
    dodatkowe_choroby: false,
    dodatkowe_choroby_opis: '',
    zespoly_genetyczne: false,
    zespoly_genetyczne_typ: '',
    zespoly_genetyczne_opis: '',
    ...(profileResp as Partial<PatientProfileData>),
  } as PatientProfileData;

  // Normalise legacy string[] history into DoseEntry[] so the renderer can
  // treat all rows uniformly.
  const leki: Lek[] = ((medsResp as { leki?: Lek[] }).leki ?? []).map((l) => ({
    ...l,
    historia_dawek: normalizeHistory((l as { historia_dawek?: unknown }).historia_dawek),
  }));
  const measurements: MeasurementEntry[] = (measResp as { entries?: MeasurementEntry[] }).entries ?? [];
  const inr: InrEntry[] = (inrResp as { entries?: InrEntry[] }).entries ?? [];

  const html = buildHtml({ profile, leki, measurements, inr });

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  // expo-print writes to a temp file with an opaque name; rename it so the
  // share sheet / saved-file uses something a human will recognise.
  const sharedUri = await renameToFriendly(uri, profile.imie_nazwisko);
  await openOrShare(sharedUri);
}

// Default UX is "open in viewer" so the user can review the report before
// sending it anywhere — they can still share from inside the viewer.
// Android: ACTION_VIEW intent on a FileProvider content:// URI.
// iOS: share sheet (canonical "open or send" surface; iOS has no direct
// "open in Files" intent equivalent).
async function openOrShare(fileUri: string): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION — receiver gets read access
        type: 'application/pdf',
      });
      return;
    } catch {
      // No PDF viewer installed, or intent rejected — fall through to the
      // share sheet so the user still has a way to do something with the file.
    }
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Otwórz lub udostępnij raport',
      UTI: 'com.adobe.pdf',
    });
  }
}

// Polish-aware slug: transliterates the most common diacritics, replaces
// anything not [A-Za-z0-9] with an underscore, collapses repeats.
function slugify(name: string): string {
  const map: Record<string, string> = {
    ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
    Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z',
  };
  return name
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function renameToFriendly(uri: string, patientName: string): Promise<string> {
  const slug = slugify(patientName) || 'Pacjent';
  const date = dayjs().format('YYYY-MM-DD');
  const filename = `Wyjatkowe_Serca_${slug}_${date}.pdf`;
  const dir = FileSystem.cacheDirectory ?? uri.replace(/[^/]+$/, '');
  const target = `${dir}${filename}`;
  try {
    // Replace any prior export with the same name.
    await FileSystem.deleteAsync(target, { idempotent: true });
    await FileSystem.moveAsync({ from: uri, to: target });
    return target;
  } catch {
    // Rename is best-effort — fall back to the original URI rather than
    // failing the whole export.
    return uri;
  }
}

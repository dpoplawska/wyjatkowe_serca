import { colors } from '../theme/colors';

export function calculateInr(pt: number, ptNormal: number, isi: number): number {
  const inr = Math.pow(pt / ptNormal, isi);
  return Math.round(inr * 100) / 100;
}

export interface InrInterpretation { label: string; color: string; bg: string }

export function getInterpretation(inr: number): InrInterpretation {
  if (inr < 1.5) return { label: 'Poniżej zakresu terapeutycznego', color: colors.warningFgStrong, bg: colors.warningBg };
  if (inr <= 2.0) return { label: 'Dolna granica zakresu terapeutycznego', color: colors.warningFgAlt, bg: colors.warningBgAlt };
  if (inr <= 3.0) return { label: 'Zakres terapeutyczny (2,0–3,0)', color: colors.successFg, bg: colors.successBg };
  if (inr <= 3.5) return { label: 'Zakres terapeutyczny dla protez zastawkowych (2,5–3,5)', color: colors.successFg, bg: colors.successBg };
  if (inr <= 4.0) return { label: 'Powyżej zakresu — skontaktuj się z lekarzem', color: colors.amberFg, bg: colors.amberBg };
  return { label: 'Bardzo wysokie — ryzyko krwawienia, pilny kontakt z lekarzem', color: colors.dangerFg, bg: colors.dangerBg };
}

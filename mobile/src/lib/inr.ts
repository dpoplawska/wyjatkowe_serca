export function calculateInr(pt: number, ptNormal: number, isi: number): number {
  const inr = Math.pow(pt / ptNormal, isi);
  return Math.round(inr * 100) / 100;
}

export function getInterpretation(inr: number): { label: string; color: string; bg: string } {
  if (inr < 1.5) return { label: 'Poniżej zakresu terapeutycznego', color: '#b45309', bg: '#fef3c7' };
  if (inr <= 2.0) return { label: 'Dolna granica zakresu terapeutycznego', color: '#a16207', bg: '#fef9c3' };
  if (inr <= 3.0) return { label: 'Zakres terapeutyczny (2,0–3,0)', color: '#166534', bg: '#dcfce7' };
  if (inr <= 3.5) return { label: 'Zakres terapeutyczny dla protez zastawkowych (2,5–3,5)', color: '#166534', bg: '#dcfce7' };
  if (inr <= 4.0) return { label: 'Powyżej zakresu — skontaktuj się z lekarzem', color: '#9a3412', bg: '#ffedd5' };
  return { label: 'Bardzo wysokie — ryzyko krwawienia, pilny kontakt z lekarzem', color: '#991b1b', bg: '#fee2e2' };
}

export function formatInrDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

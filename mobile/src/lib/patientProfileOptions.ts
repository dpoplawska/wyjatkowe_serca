export const GRUPY_KRWI = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];

export const WADY_SERCA = [
  'Arytmie nadkomorowe',
  'Arytmogenna kardiomiopatia prawej komory',
  'Atrezja (zarośnięcie) zastawki mitralnej',
  'Atrezja (zarośnięcie) zastawki trójdzielnej (AT)',
  'Bradyarytmie',
  'Całkowite nieprawidłowe połączenie żył płucnych',
  'Choroba Kawasaki',
  'Choroba Kawasakiego',
  'Częściowy nieprawidłowy spływ żył płucnych',
  'Dwunapływowa lewa komora',
  'Dwuujściowa prawa komora (DORV)',
  'Guzy serca',
  'Infekcyjne zapalenie wsierdzia',
  'Kanał przedsionkowo-komorowy',
  'Kardiomiopatia przerostowa (HCM)',
  'Kardiomiopatia restrykcyjna',
  'Kardiomiopatia rozstrzeniowa (zastoinowa) (DCM)',
  'Komorowe zaburzenia rytmu serca',
  'Mechaniczne wspomaganie serca (VAD)',
  'Nadkomorowe zaburzenia rytmu serca',
  'Nadzastawkowe zwężenie aorty',
  'Nawrotowy częstoskurcz przedsionkowo-komorowy',
  'Niezrównoważony kanał przedsionkowo-komorowy',
  'Okienko aortalno-płucne',
  'Pierścienie naczyniowe',
  'Podzastawkowe zwężenie aorty',
  'Przełożenie dużych naczyń',
  'Przerwanie łuku aorty',
  'Przetoki tętnic wieńcowych',
  'Przetrwały przewód tętniczy (Botalla)',
  'Serce jednokomorowe',
  'Serce trójprzedsionkowe',
  'Skorygowane przełożenie dużych naczyń',
  'Transplantacja serca',
  'Ubytek przegrody międzykomorowej (VSD)',
  'Ubytek przegrody międzyprzedsionkowej (ASD)',
  'Wspólny pień tętniczy',
  'Zapalenie mięśnia sercowego',
  'Zapalenie osierdzia',
  'Zarośnięcie zastawki tętnicy płucnej z ciągłą przegrodą międzykomorową',
  'Zastawkowe zwężenie aorty',
  'Zespoły arytmii wrodzonych',
  "Zespół Blanda, White'a i Garlanda",
  'Zespół Ebsteina',
  'Zespół Fallota',
  'Zespół niedorozwoju lewego serca (HLHS)',
  'Zespół niedorozwoju prawego serca (HRHS)',
  "Zespół preekscytacji. Zespół Wolffa, Parkinsona i White'a",
  'Zespół wrodzonego braku zastawki tętnicy płucnej',
  'Zwężenie cieśni aorty (koarktacja aorty)',
  'Zwężenie lub niedomykalność zastawki mitralnej',
  'Zwężenie zastawki tętnicy płucnej',
];

export const ZABURZENIA_RYTMU_TYPY = [
  'Blok przedsionkowo-komorowy I°',
  'Blok przedsionkowo-komorowy II°',
  'Blok przedsionkowo-komorowy III° (całkowity)',
  'Bradykardia zatokowa',
  'Częstoskurcz komorowy',
  'Częstoskurcz nadkomorowy (SVT)',
  'Migotanie przedsionków',
  'Trzepotanie przedsionków',
  "Zespół Wolffa-Parkinsona-White'a (WPW)",
  'Inne',
];

export const ROZRUSZNIKI = [
  'Kardiowerter-defibrylator (ICD)',
  'Kardiowerter-defibrylator resynchronizujący (CRT-D)',
  'Stymulator dwujamowy (DDD)',
  'Stymulator epikardialny',
  'Stymulator jednojamowy (VVI)',
  'Stymulator resynchronizujący (CRT-P)',
  'Inne',
];

export const ZESPOLY_GENETYCZNE_TYPY = [
  "Zespół DiGeorge'a (22q11.2)",
  'Zespół Downa (trisomia 21)',
  'Zespół Ehlersa-Danlosa',
  'Zespół Marfana',
  'Zespół Noonan',
  'Zespół Turnera (45,X)',
  'Zespół Williamsa',
  'Inne',
];

export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const chars = query.toLowerCase().split('');
  const lower = text.toLowerCase();
  let idx = 0;
  for (const ch of chars) {
    const found = lower.indexOf(ch, idx);
    if (found === -1) return false;
    idx = found + 1;
  }
  return true;
}

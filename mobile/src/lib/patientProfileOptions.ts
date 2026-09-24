export const GRUPY_KRWI = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];

// Rozpoznania kardiologiczne do wyboru w profilu pacjenta.
// Zakres oparty na ICD-10 Q20-Q26 (wrodzone wady układu krążenia) uzupełnionym
// o jednostki kliniczne używane w polskiej kardiologii dziecięcej oraz o nabyte
// choroby serca, które fundacja rejestrowała już wcześniej.
// Grupy są tylko dla czytelności pliku — WADY_SERCA jest płaską listą alfabetyczną.

const WS_00 = [
  // Ubytki przegród
  'Ubytek przegrody międzyprzedsionkowej (ASD)',
  'Ubytek przegrody międzyprzedsionkowej typu otworu wtórnego (ASD II)',
  'Ubytek przegrody międzyprzedsionkowej typu otworu pierwotnego (ASD I)',
  'Ubytek przegrody międzyprzedsionkowej typu zatoki żylnej',
  'Ubytek przegrody międzyprzedsionkowej typu zatoki wieńcowej',
  'Wspólny przedsionek (brak przegrody międzyprzedsionkowej)',
  'Przetrwały otwór owalny (PFO)',
  'Tętniak przegrody międzyprzedsionkowej',
  'Ubytek przegrody międzykomorowej (VSD)',
  'Ubytek przegrody międzykomorowej okołobłoniasty',
  'Ubytek przegrody międzykomorowej mięśniowy',
  'Ubytek przegrody międzykomorowej napływowy',
  'Ubytek przegrody międzykomorowej podtętniczy (odpływowy)',
  'Mnogie ubytki przegrody międzykomorowej',
  'Ubytek przegrody międzykomorowej typu Gerbodego',
  'Kanał przedsionkowo-komorowy (AVSD)',
  'Całkowity kanał przedsionkowo-komorowy (CAVSD)',
  'Częściowy kanał przedsionkowo-komorowy (PAVSD)',
  'Niezrównoważony kanał przedsionkowo-komorowy',
  'Okienko aortalno-płucne',
];

const WS_01 = [
  // Zastawka aortalna i droga odpływu lewej komory
  'Zastawkowe zwężenie aorty',
  'Podzastawkowe zwężenie aorty',
  'Nadzastawkowe zwężenie aorty',
  'Dwupłatkowa zastawka aortalna (BAV)',
  'Wrodzona niedomykalność zastawki aortalnej',
  'Atrezja (zarośnięcie) zastawki aortalnej',
  'Tunel aortalno-lewokomorowy',
  'Tętniak zatoki Valsalvy',
  "Zespół Shone'a",
];

const WS_02 = [
  // Zastawka mitralna
  'Wrodzone zwężenie zastawki mitralnej',
  'Wrodzona niedomykalność zastawki mitralnej',
  'Zwężenie lub niedomykalność zastawki mitralnej',
  'Atrezja (zarośnięcie) zastawki mitralnej',
  'Wypadanie płatka zastawki mitralnej (MVP)',
  'Spadochronowa zastawka mitralna',
  'Nadzastawkowy pierścień mitralny',
  'Rozszczep płatka zastawki mitralnej',
  'Zespół Lutembachera',
];

const WS_03 = [
  // Zastawka trójdzielna
  'Atrezja (zarośnięcie) zastawki trójdzielnej (AT)',
  'Anomalia Ebsteina',
  'Wrodzone zwężenie zastawki trójdzielnej',
  'Wrodzona niedomykalność zastawki trójdzielnej',
];

const WS_04 = [
  // Zastawka tętnicy płucnej i droga odpływu prawej komory
  'Zwężenie zastawki tętnicy płucnej',
  'Wrodzona niedomykalność zastawki tętnicy płucnej',
  'Zespół wrodzonego braku zastawki tętnicy płucnej (APVS)',
  'Zarośnięcie zastawki tętnicy płucnej z ciągłą przegrodą międzykomorową (PA-IVS)',
  'Zarośnięcie zastawki tętnicy płucnej z ubytkiem przegrody międzykomorowej (PA-VSD)',
  'Zwężenie podzastawkowe (lejkowe) tętnicy płucnej',
  'Nadzastawkowe zwężenie tętnicy płucnej',
  'Obwodowe zwężenia tętnic płucnych',
  'Prawa komora dwujamowa (DCRV)',
];

const WS_05 = [
  // Wady złożone i sinicze
  'Tetralogia Fallota',
  'Tetralogia Fallota z zarośnięciem zastawki tętnicy płucnej',
  'Tetralogia Fallota z brakiem zastawki tętnicy płucnej',
  'Przełożenie wielkich pni tętniczych (TGA)',
  'Skorygowane przełożenie wielkich pni tętniczych (ccTGA)',
  'Dwuujściowa prawa komora (DORV)',
  'Dwuujściowa lewa komora (DOLV)',
  'Zespół Taussig-Bing',
  'Dwunapływowa lewa komora (DILV)',
  'Dwunapływowa prawa komora (DIRV)',
  'Wspólny pień tętniczy',
  'Serce jednokomorowe',
  'Zespół niedorozwoju lewego serca (HLHS)',
  'Zespół niedorozwoju prawego serca (HRHS)',
  'Hipoplazja prawej komory',
];

const WS_06 = [
  // Aorta i duże tętnice
  'Zwężenie cieśni aorty (koarktacja aorty)',
  'Przerwanie łuku aorty',
  'Hipoplazja łuku aorty',
  'Przetrwały przewód tętniczy Botalla (PDA)',
  'Pierścienie naczyniowe',
  'Podwójny łuk aorty',
  'Prawostronny łuk aorty',
  'Pętla naczyniowa lewej tętnicy płucnej',
  'Nieprawidłowe odejście prawej tętnicy podobojczykowej (arteria lusoria)',
  'Tętniak aorty wstępującej',
];

const WS_07 = [
  // Żyły płucne i systemowe
  'Całkowite nieprawidłowe połączenie żył płucnych (TAPVC)',
  'Częściowy nieprawidłowy spływ żył płucnych (PAPVC)',
  'Zespół szabli (zespół scimitar)',
  'Zwężenie żył płucnych',
  'Serce trójprzedsionkowe',
  'Przetrwała lewa żyła główna górna (PLSVC)',
  'Wrodzone zwężenie żyły głównej',
];

const WS_08 = [
  // Tętnice wieńcowe
  "Zespół Blanda, White'a i Garlanda (ALCAPA)",
  'Nieprawidłowe odejście prawej tętnicy wieńcowej od pnia płucnego (ARCAPA)',
  'Nieprawidłowe odejście tętnicy wieńcowej z przeciwległej zatoki (AAOCA)',
  'Przetoki tętnic wieńcowych',
  'Mostek mięśniowy nad tętnicą wieńcową',
];

const WS_09 = [
  // Położenie serca i zespoły heterotaksji
  'Dekstrokardia (prawostronne położenie serca)',
  'Mezokardia (pośrodkowe położenie serca)',
  'Zespół heterotaksji',
  'Izomeryzm prawoprzedsionkowy (asplenia)',
  'Izomeryzm lewoprzedsionkowy (polisplenia)',
  'Zespół Ivemarka',
  'Ektopia serca',
];

const WS_10 = [
  // Kardiomiopatie
  'Kardiomiopatia przerostowa (HCM)',
  'Kardiomiopatia rozstrzeniowa (zastoinowa) (DCM)',
  'Kardiomiopatia restrykcyjna',
  'Arytmogenna kardiomiopatia prawej komory (ARVC)',
  'Niescalenie mięśnia lewej komory (LVNC)',
  'Anomalia Uhla',
];

const WS_11 = [
  // Wrodzone zespoły arytmii i zaburzenia rytmu
  'Zespoły arytmii wrodzonych',
  'Zespół długiego QT (LQTS)',
  'Zespół krótkiego QT (SQTS)',
  'Zespół Brugadów',
  'Katecholaminergiczny wielokształtny częstoskurcz komorowy (CPVT)',
  'Wrodzony blok przedsionkowo-komorowy',
  "Zespół preekscytacji (Wolffa-Parkinsona-White'a, WPW)",
  'Nawrotowy częstoskurcz przedsionkowo-komorowy',
  'Nadkomorowe zaburzenia rytmu serca',
  'Komorowe zaburzenia rytmu serca',
  'Bradyarytmie',
];

const WS_12 = [
  // Guzy serca
  'Guzy serca',
  'Mięśniak prążkowanokomórkowy serca (rhabdomyoma)',
  'Śluzak serca (myxoma)',
  'Włókniak serca (fibroma)',
];

const WS_13 = [
  // Choroby nabyte i pozostałe rozpoznania kardiologiczne
  'Choroba Kawasaki',
  'Infekcyjne zapalenie wsierdzia',
  'Zapalenie mięśnia sercowego',
  'Zapalenie osierdzia',
  'Gorączka reumatyczna i reumatyczna wada serca',
  'Zespół Eisenmengera',
  'Nadciśnienie płucne',
  'Transplantacja serca',
  'Mechaniczne wspomaganie serca (VAD)',
];

export const WADY_SERCA = [
  WS_00,
  WS_01,
  WS_02,
  WS_03,
  WS_04,
  WS_05,
  WS_06,
  WS_07,
  WS_08,
  WS_09,
  WS_10,
  WS_11,
  WS_12,
  WS_13,
].flat().sort((a, b) => a.localeCompare(b, 'pl'));

// Nazwy używane we wcześniejszych wersjach aplikacji. Profile zapisane pod starą
// nazwą są mapowane na obowiązującą przy wczytywaniu, żeby nie zgubić rozpoznania
// i żeby dało się je odznaczyć na liście.
export const WADY_SERCA_ALIASY: Record<string, string> = {
  'Arytmie nadkomorowe': 'Nadkomorowe zaburzenia rytmu serca',
  'Arytmogenna kardiomiopatia prawej komory': 'Arytmogenna kardiomiopatia prawej komory (ARVC)',
  'Całkowite nieprawidłowe połączenie żył płucnych': 'Całkowite nieprawidłowe połączenie żył płucnych (TAPVC)',
  'Choroba Kawasakiego': 'Choroba Kawasaki',
  'Częściowy nieprawidłowy spływ żył płucnych': 'Częściowy nieprawidłowy spływ żył płucnych (PAPVC)',
  'Dwunapływowa lewa komora': 'Dwunapływowa lewa komora (DILV)',
  'Kanał przedsionkowo-komorowy': 'Kanał przedsionkowo-komorowy (AVSD)',
  'Przetrwały przewód tętniczy (Botalla)': 'Przetrwały przewód tętniczy Botalla (PDA)',
  'Przełożenie dużych naczyń': 'Przełożenie wielkich pni tętniczych (TGA)',
  'Skorygowane przełożenie dużych naczyń': 'Skorygowane przełożenie wielkich pni tętniczych (ccTGA)',
  'Zarośnięcie zastawki tętnicy płucnej z ciągłą przegrodą międzykomorową': 'Zarośnięcie zastawki tętnicy płucnej z ciągłą przegrodą międzykomorową (PA-IVS)',
  "Zespół Blanda, White'a i Garlanda": "Zespół Blanda, White'a i Garlanda (ALCAPA)",
  'Zespół Ebsteina': 'Anomalia Ebsteina',
  'Zespół Fallota': 'Tetralogia Fallota',
  "Zespół preekscytacji. Zespół Wolffa, Parkinsona i White'a": "Zespół preekscytacji (Wolffa-Parkinsona-White'a, WPW)",
  'Zespół wrodzonego braku zastawki tętnicy płucnej': 'Zespół wrodzonego braku zastawki tętnicy płucnej (APVS)',
};

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

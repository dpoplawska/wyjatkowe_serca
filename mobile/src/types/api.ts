// Mirrors backend/app/models.py — keep field names identical.

export interface Operacja {
  // Client-side stable key for list rendering. Generated on add or on load
  // if missing. Backend doesn't persist it (Pydantic drops unknown fields).
  id?: string;
  typ: string;
  data: string;
  czas_it: string;
}

export interface PatientProfileData {
  imie_nazwisko: string;
  grupa_krwi: string;
  wada_serca: string[];
  zaburzenia_rytmu: boolean;
  zaburzenia_rytmu_typ: string;
  zaburzenia_rytmu_opis: string;
  rozrusznik_serca: boolean;
  rozrusznik_serca_typ: string;
  przebyte_operacje: Operacja[];
  powiklania: boolean;
  powiklania_opis: string;
  dodatkowe_choroby: boolean;
  dodatkowe_choroby_opis: string;
  zespoly_genetyczne: boolean;
  zespoly_genetyczne_typ: string;
  zespoly_genetyczne_opis: string;
}

export interface Lek {
  id: string;
  nazwa: string;
  data_pierwszej_dawki: string;
  godzina_pierwszej_dawki: string;
  czestotliwosc: string;
  czas_trwania_typ: string;
  czas_trwania_wartosc: number;
  sledzenie: boolean;
  ostatnia_dawka: string;
  historia_dawek: string[];
  nastepna_dawka_override: string;
}

export interface MedicationsData {
  leki: Lek[];
}

export interface InrEntry {
  id: string;
  date: string;
  inr: number;
  pt: number;
  pt_normal: number;
  isi: number;
  note: string;
}

export interface InrData {
  entries: InrEntry[];
}

export interface MeasurementEntry {
  id: string;
  date: string;
  saturacja: number | null;
  tetno: number | null;
  cisnienie_skurczowe: number | null;
  cisnienie_rozkurczowe: number | null;
  diureza: number | null;
  note: string;
}

export interface MeasurementsData {
  entries: MeasurementEntry[];
}

export interface DevUser {
  uid: string;
  email: string;
}

export interface InviteInfo {
  ownerUid: string;
  childName: string;
  hasExistingData: boolean;
}

export const EMPTY_PATIENT_PROFILE: PatientProfileData = {
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
};

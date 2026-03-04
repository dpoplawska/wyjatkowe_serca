const b = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET!;
const u = (path: string) =>
  `https://firebasestorage.googleapis.com/v0/b/${b}/o/${encodeURIComponent(path)}?alt=media`;

export const LOGO = u('logo_podstawowe.png');
export const LOGO_MIS = u('logo_sam_mis.png');
export const PHOTO_TEAM = u('zdjecie_zespolu.jpg');
export const PHOTO_TEAM_DOCTORS = u('zdjecie_zespolu_z_lekarzami.jpg');

export const PDF_PRIVACY = u('Polityka_prywatnosci.pdf');
export const PDF_REGULATIONS = u('Regulamin_serwisu_FWS.pdf');
export const PDF_STATUT = u('Statut.pdf');
export const PDF_KONKURS = u('OGLOSZENIE_O_KONKURSIE.pdf');
export const PDF_SPRAWOZDANIE_2024 = u('Sprawozdanie finansowe WyjatkoweSerca 2024.pdf');

export const NERKA = [1, 2, 3, 4, 5, 6].map(n => u(`nerka/${n}.png`));

export const POLACZENI_W_KRYZYSIE = [
  u('polaczeni_w_kryzysie/1.JPG'), u('polaczeni_w_kryzysie/2.JPG'),
  u('polaczeni_w_kryzysie/3.JPG'), u('polaczeni_w_kryzysie/4.JPG'),
  u('polaczeni_w_kryzysie/5.jpg'), u('polaczeni_w_kryzysie/6.JPG'),
  u('polaczeni_w_kryzysie/7.png'), u('polaczeni_w_kryzysie/8.png'),
  u('polaczeni_w_kryzysie/9.png'), u('polaczeni_w_kryzysie/10.png'),
  u('polaczeni_w_kryzysie/11.JPG'),
];

export const BENEFICIARIES = {
  ws1: u('beneficiaries/WS1-DanusiaGrzyb.JPG'),
  ws2: u('beneficiaries/WS2-FranciszekGrzyb.JPG'),
  ws3: u('beneficiaries/WS3-CyprianZawadzki.png'),
  ws4: u('beneficiaries/WS4-MikolajWegierski.JPG'),
  ws5: u('beneficiaries/WS5-CecyliaSuchocka.JPG'),
  ws6: u('beneficiaries/WS6-HubertSzymborski.png'),
  ws7: u('beneficiaries/WS7-NikodemKochel.jpeg'),
  ws8_1: u('beneficiaries/WS8-2-AgnieszkaPtaszek.JPG'),
  ws8_2: u('beneficiaries/WS8-1-AgnieszkaPtaszek.JPG'),
  ws8_3: u('beneficiaries/WS8-3-AgnieszkaPtaszek.JPG'),
};

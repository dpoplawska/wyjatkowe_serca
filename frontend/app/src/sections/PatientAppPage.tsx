import { useLocation } from 'react-router-dom';
import { LOGO as logo } from '../app/mediaUrls.ts';

const RED = '#EC1A3B';
const BLUE = '#2383C5';
const GREY1 = '#2E2E2E';
const GREY2 = '#616161';

const CONTACT_EMAIL = 'fundacja@wyjatkoweserca.pl';

// Landing page for the two /app links the mobile app puts in front of people:
// the invite link a parent shares with a co-carer, and the bare /app address.
// On a phone with the app installed, Android App Links open the app and this
// page is never shown. Everyone else used to be bounced to the homepage with
// no explanation — this page is what they get instead. It deliberately does
// not try to resolve the token: that needs a signed-in session, which only
// the app has.
export default function PatientAppPage() {
  const hasToken = new URLSearchParams(useLocation().search).has('token');

  return (
    <section style={styles.page}>
      <div style={styles.card}>
        <img src={logo} alt="Fundacja Wyjątkowe Serca" style={styles.logo} />

        <h1 style={styles.title}>
          {hasToken ? 'Zaproszenie do profilu pacjenta' : 'Aplikacja pacjenta'}
        </h1>

        <p style={styles.lead}>
          {hasToken
            ? 'Ten link otwiera się w aplikacji Wyjątkowe Serca — Pacjent. To w niej przyjmiesz zaproszenie i zobaczysz profil dziecka.'
            : 'Profil pacjenta prowadzimy w aplikacji Wyjątkowe Serca — Pacjent na telefon.'}
        </p>

        <div style={styles.block}>
          <h2 style={styles.blockTitle}>Masz już aplikację</h2>
          <p style={styles.blockText}>
            {hasToken
              ? 'Otwórz ten link na telefonie, na którym jest zainstalowana aplikacja. Zaproszenie pojawi się w niej automatycznie.'
              : 'Otwórz aplikację na telefonie i zaloguj się kontem Google.'}
          </p>
        </div>

        <div style={styles.block}>
          <h2 style={styles.blockTitle}>Nie masz jeszcze aplikacji</h2>
          <p style={styles.blockText}>
            Aplikacja trafi wkrótce do Google Play i App Store. Zanim się tam pojawi, napisz
            do nas — pomożemy ją zainstalować.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} style={styles.button}>
            {CONTACT_EMAIL}
          </a>
        </div>

        {hasToken && (
          <p style={styles.note}>
            Zaproszenie jest ważne 7 dni od wysłania. Jeśli straciło ważność, poproś o nowe
            osobę, która prowadzi profil.
          </p>
        )}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px 20px 64px',
  },
  card: {
    width: '100%',
    maxWidth: 620,
    textAlign: 'center',
  },
  logo: {
    width: 140,
    height: 'auto',
    marginBottom: 24,
  },
  title: {
    color: RED,
    fontWeight: 700,
    fontSize: 28,
    margin: '0 0 12px',
  },
  lead: {
    color: GREY1,
    fontSize: 17,
    lineHeight: 1.6,
    margin: '0 0 32px',
  },
  block: {
    textAlign: 'left',
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: 12,
    padding: '20px 22px',
    marginBottom: 16,
  },
  blockTitle: {
    color: BLUE,
    fontWeight: 700,
    fontSize: 17,
    margin: '0 0 8px',
  },
  blockText: {
    color: GREY2,
    fontSize: 15,
    lineHeight: 1.6,
    margin: 0,
  },
  button: {
    display: 'inline-block',
    marginTop: 14,
    padding: '10px 18px',
    borderRadius: 999,
    background: RED,
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 15,
    textDecoration: 'none',
  },
  note: {
    color: GREY2,
    fontSize: 14,
    lineHeight: 1.6,
    marginTop: 8,
  },
};

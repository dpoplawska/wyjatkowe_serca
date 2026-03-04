import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.tsx';
import { LOGO as logo } from './mediaUrls.ts';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22px" height="22px">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

export default function AppLogin() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  if (loading) return <div style={styles.loadingWrap}>Ładowanie...</div>;
  if (user) return <Navigate to="/app/profil-pacjenta" replace />;

  const handleSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user') {
        setError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src={logo} alt="Wyjątkowe Serca" style={styles.logo} />
        <h1 style={styles.appName}>Wyjątkowe Serca</h1>
        <h2 style={styles.title}>Profil pacjenta</h2>
        <p style={styles.subtitle}>
          Zaloguj się, aby zarządzać profilem medycznym pacjenta.
          <br />
          Jeśli nie masz jeszcze konta, zostanie ono utworzone automatycznie.
        </p>

        <button
          onClick={handleSignIn}
          disabled={signingIn}
          style={{ ...styles.googleBtn, ...(signingIn ? styles.googleBtnDisabled : {}) }}
        >
          <GoogleIcon />
          <span>{signingIn ? 'Logowanie...' : 'Kontynuuj z kontem Google'}</span>
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf2f4',
    padding: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    padding: '48px 40px',
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center',
  },
  logo: {
    width: '90px',
    height: 'auto',
    marginBottom: '16px',
  },
  appName: {
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 700,
    fontSize: '22px',
    color: '#EC1A3B',
    margin: '0 0 4px',
  },
  title: {
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 600,
    fontSize: '18px',
    color: '#2E2E2E',
    margin: '0 0 16px',
  },
  subtitle: {
    fontFamily: 'Quicksand, sans-serif',
    color: '#616161',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  googleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    border: '1.5px solid #dadce0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#3c4043',
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'background 0.2s, box-shadow 0.2s',
    width: '100%',
    justifyContent: 'center',
  },
  googleBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    marginTop: '16px',
    color: '#EC1A3B',
    fontFamily: 'Quicksand, sans-serif',
    fontSize: '14px',
  },
  loadingWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Quicksand, sans-serif',
    color: '#616161',
  },
};

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { useAuth } from './AuthContext.tsx';
import { LOGO as logo } from './mediaUrls.ts';
import { API } from './config.ts';

export default function AcceptInvite() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [childName, setChildName] = useState('');
  const [hasExistingData, setHasExistingData] = useState(false);
  const [fetchingInvite, setFetchingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Store token in sessionStorage so we can resume after login redirect
  useEffect(() => {
    if (token) sessionStorage.setItem('pendingInviteToken', token);
  }, [token]);

  // Once user is logged in, validate the invite
  useEffect(() => {
    if (!user || !token) return;
    setFetchingInvite(true);
    user.getIdToken().then(idToken =>
      fetch(`${API}/invite/${token}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
    ).then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setInviteError(data.detail ?? 'Zaproszenie jest nieprawidłowe lub wygasło.');
      } else {
        const data = await res.json();
        setChildName(data.childName ?? '');
        setHasExistingData(data.hasExistingData ?? false);
      }
    }).catch(() => {
      setInviteError('Nie udało się pobrać zaproszenia. Sprawdź połączenie.');
    }).finally(() => setFetchingInvite(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  const handleAccept = async () => {
    if (!user) return;
    setAccepting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`${API}/accept-invite/${token}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setInviteError(data.detail ?? 'Nie udało się zaakceptować zaproszenia.');
        return;
      }
      sessionStorage.removeItem('pendingInviteToken');
      navigate('/app/profil-pacjenta', { replace: true });
    } catch {
      setInviteError('Nie udało się zaakceptować zaproszenia. Spróbuj ponownie.');
    } finally {
      setAccepting(false);
    }
  };

  if (!token) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={s.error}>Brak tokenu zaproszenia w adresie URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <img src={logo} alt="Wyjątkowe Serca" style={s.logo} />
        <h1 style={s.appName}>Wyjątkowe Serca</h1>
        <h2 style={s.title}>Zaproszenie do profilu</h2>

        {loading || fetchingInvite ? (
          <div style={s.center}><CircularProgress style={{ color: '#EC1A3B' }} /></div>
        ) : inviteError ? (
          <p style={s.error}>{inviteError}</p>
        ) : !user ? (
          <>
            <p style={s.subtitle}>
              Zostałeś/aś zaproszony/a do zarządzania profilem medycznym pacjenta.
              <br />
              Zaloguj się kontem Google, aby kontynuować.
            </p>
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              style={{ ...s.googleBtn, ...(signingIn ? s.googleBtnDisabled : {}) }}
            >
              {signingIn ? 'Logowanie...' : 'Zaloguj się przez Google'}
            </button>
          </>
        ) : (
          <>
            <p style={s.subtitle}>
              {childName
                ? <>Zostałeś/aś zaproszony/a do zarządzania profilem pacjenta <strong>{childName}</strong>.</>
                : 'Zostałeś/aś zaproszony/a do zarządzania profilem pacjenta.'}
              <br />
              Po akceptacji będziesz mieć pełny dostęp do danych i będziesz móc je edytować.
            </p>
            {hasExistingData && (
              <div style={s.warning}>
                Twoje konto ma już zapisany profil pacjenta. Po akceptacji zaproszenia Twoje dotychczasowe dane nie będą dostępne przez aplikację.
              </div>
            )}
            <div style={s.btnRow}>
              <button
                onClick={() => { sessionStorage.removeItem('pendingInviteToken'); navigate('/app/profil-pacjenta', { replace: true }); }}
                disabled={accepting}
                style={s.rejectBtn}
              >
                Odrzuć
              </button>
              <button
                onClick={handleAccept}
                disabled={accepting}
                style={{ ...s.acceptBtn, ...(accepting ? s.acceptBtnDisabled : {}) }}
              >
                {accepting ? 'Akceptowanie...' : 'Akceptuj'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
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
    marginBottom: '28px',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 0',
  },
  error: {
    fontFamily: 'Quicksand, sans-serif',
    color: '#EC1A3B',
    fontSize: '14px',
    marginTop: '16px',
  },
  googleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
  },
  googleBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  warning: {
    fontFamily: 'Quicksand, sans-serif',
    fontSize: '13px',
    color: '#7a4a00',
    backgroundColor: '#fff8e1',
    border: '1px solid #ffe082',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '12px',
    textAlign: 'left' as const,
    lineHeight: '1.5',
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
  },
  rejectBtn: {
    flex: 1,
    padding: '12px 0',
    border: '1.5px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#616161',
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
  },
  acceptBtn: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#EC1A3B',
    color: '#fff',
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
  },
  acceptBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

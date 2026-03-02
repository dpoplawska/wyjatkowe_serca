import { useLocation, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import logo from '../media/logo_podstawowe.png';

interface AppHeaderProps {
  user: User;
  logout: () => void;
}

const TABS = [
  { label: 'Profil pacjenta', path: '/app/profil-pacjenta' },
  { label: 'Leki', path: '/app/leki' },
];

export default function AppHeader({ user, logout }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header style={s.header}>
      <div style={s.headerLeft}>
        <img src={logo} alt="Wyjątkowe Serca" style={s.headerLogo} />
        <span style={s.headerTitle}>Wyjątkowe Serca</span>
      </div>

      <nav style={s.tabs}>
        {TABS.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{ ...s.tab, ...(active ? s.tabActive : {}) }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div style={s.headerRight}>
        <span style={s.headerEmail}>{user.email}</span>
        <button onClick={logout} style={s.logoutBtn}>Wyloguj</button>
      </div>
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    height: '60px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  headerLogo: {
    height: '32px',
    width: 'auto',
  },
  headerTitle: {
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 700,
    fontSize: '17px',
    color: '#EC1A3B',
  },
  tabs: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '4px',
    height: '100%',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '0 16px',
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    color: '#616161',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'color 0.15s',
  },
  tabActive: {
    color: '#EC1A3B',
    borderBottom: '3px solid #EC1A3B',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
  },
  headerEmail: {
    fontFamily: 'Quicksand, sans-serif',
    fontSize: '13px',
    color: '#616161',
  },
  logoutBtn: {
    background: 'none',
    border: '1.5px solid #EC1A3B',
    borderRadius: '6px',
    color: '#EC1A3B',
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 600,
    fontSize: '13px',
    padding: '6px 14px',
    cursor: 'pointer',
  },
};

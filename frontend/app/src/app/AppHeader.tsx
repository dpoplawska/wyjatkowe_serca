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
      <div style={s.topRow}>
        <div style={s.headerLeft}>
          <img src={logo} alt="Wyjątkowe Serca" style={s.headerLogo} />
          <span style={s.headerTitle}>Wyjątkowe Serca</span>
        </div>
        <div style={s.headerRight}>
          <span style={s.headerEmail}>{user.email}</span>
          <button onClick={logout} style={s.logoutBtn}>Wyloguj</button>
        </div>
      </div>

      <nav style={s.tabRow}>
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
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    fontFamily: 'Quicksand, sans-serif',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '52px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },
  headerLogo: {
    height: '32px',
    width: 'auto',
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: '17px',
    color: '#EC1A3B',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
    marginLeft: '16px',
  },
  headerEmail: {
    fontSize: '13px',
    color: '#616161',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '200px',
  },
  logoutBtn: {
    background: 'none',
    border: '1.5px solid #EC1A3B',
    borderRadius: '6px',
    color: '#EC1A3B',
    fontWeight: 600,
    fontSize: '13px',
    padding: '6px 14px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  tabRow: {
    display: 'flex',
    borderTop: '1px solid #f0f0f0',
    padding: '0 24px',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '10px 16px',
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
};

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Squash as Hamburger } from 'hamburger-react';
import { LOGO as logo } from './mediaUrls.ts';

interface AppHeaderProps {
  user: User;
  logout: () => void;
}

const TABS = [
  { label: 'Profil pacjenta', path: '/app/profil-pacjenta' },
  { label: 'Leki', path: '/app/leki' },
  { label: 'Kalkulator INR', path: '/app/kalkulator-inr' },
];

const MOBILE_BREAKPOINT = 600;

export default function AppHeader({ user, logout }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleNav = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <header style={{ ...s.header, position: 'relative' as const }}>
      <div style={s.topRow}>
        <div style={s.headerLeft}>
          <img src={logo} alt="Wyjątkowe Serca" style={s.headerLogo} />
        </div>
        <div style={s.headerRight}>
          {!isMobile && <span style={s.headerEmail}>{user.email}</span>}
          {isMobile ? (
            <Hamburger toggled={menuOpen} toggle={setMenuOpen} size={24} />
          ) : (
            <button onClick={logout} style={s.logoutBtn}>Wyloguj</button>
          )}
        </div>
      </div>

      {!isMobile && (
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
      )}

      {isMobile && menuOpen && (
        <div style={s.mobileMenu}>
          {TABS.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => handleNav(tab.path)}
                style={{ ...s.mobileTab, ...(active ? s.mobileTabActive : {}) }}
              >
                {tab.label}
              </button>
            );
          })}
          <div style={s.mobileMenuDivider} />
          <div style={s.mobileEmail}>{user.email}</div>
          <button onClick={logout} style={s.mobileLogoutBtn}>Wyloguj</button>
        </div>
      )}
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    fontFamily: 'Quicksand, sans-serif',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    height: '52px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
    overflow: 'hidden',
  },
  headerLogo: {
    height: '32px',
    width: 'auto',
    flexShrink: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 1,
    minWidth: 0,
    marginLeft: 'auto',
    paddingLeft: '16px',
  },
  headerEmail: {
    fontSize: '13px',
    color: '#616161',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
    minWidth: 0,
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
    fontFamily: 'Quicksand, sans-serif',
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
    fontFamily: 'Quicksand, sans-serif',
  },
  tabActive: {
    color: '#EC1A3B',
    borderBottom: '3px solid #EC1A3B',
  },
  mobileMenu: {
    position: 'absolute' as const,
    top: '52px',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '8px 0 16px',
  },
  mobileTab: {
    background: 'none',
    border: 'none',
    textAlign: 'left' as const,
    padding: '14px 24px',
    fontWeight: 600,
    fontSize: '15px',
    color: '#616161',
    cursor: 'pointer',
    fontFamily: 'Quicksand, sans-serif',
  },
  mobileTabActive: {
    color: '#EC1A3B',
    backgroundColor: '#fef2f4',
  },
  mobileMenuDivider: {
    borderTop: '1px solid #f0f0f0',
    margin: '8px 0',
  },
  mobileEmail: {
    fontSize: '12px',
    color: '#999',
    padding: '4px 24px 8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  mobileLogoutBtn: {
    background: 'none',
    border: '1.5px solid #EC1A3B',
    borderRadius: '6px',
    color: '#EC1A3B',
    fontWeight: 600,
    fontSize: '13px',
    padding: '8px 14px',
    cursor: 'pointer',
    margin: '0 24px',
    fontFamily: 'Quicksand, sans-serif',
  },
};

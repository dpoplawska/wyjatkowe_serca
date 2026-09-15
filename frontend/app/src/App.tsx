import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Main from './sections/Main.tsx';
import Footer from './sections/Footer.tsx';
import ThankYou from './sections/ThankYou.tsx';
import CharityFundraser from './sections/CharityFundraiser.tsx';
import Shop from "./sections/Shop.tsx";
import LoginPage from './sections/LoginPage.tsx';
import Menu from './sections/Menu.tsx';
import BeneficiariesPage from './sections/BeneficiariesPage.tsx';
import ConnectedInCrisisPage from './sections/ConnectedInCrisisPage.tsx';
import FinancialReportsPage from './sections/FinancialReportsPage.tsx';
import { AuthProvider } from './app/AuthContext.tsx';
import AppLogin from './app/AppLogin.tsx';
import AcceptInvite from './app/AcceptInvite.tsx';
import PatientProfile from './app/PatientProfile.tsx';
import Medications from './app/Medications.tsx';
import InrCalculator from './app/InrCalculator.tsx';
import Pomiary from './app/Pomiary.tsx';
import { beneficiaries } from './sections/components/beneficiaries/BeneficiariesData.tsx';

function AppContent() {
  const location = useLocation();
  const isAppSection = location.pathname.startsWith('/app');

  return (
    <>
      <div className="App">
        {!isAppSection && <Menu />}
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/dziekujemy" element={<ThankYou />} />
          <Route path="/zbiorka/fundacja" element={<CharityFundraser specialFundraiser={false} />} />
          {beneficiaries.map(({ id, moreInfoLink }) => (
            <Route
              key={id}
              path={moreInfoLink}
              element={
                <CharityFundraser
                  specialFundraiser={true}
                  beneficiary={id}
                />
              }
            />
          ))}
          <Route path="polaczeni_w_kryzysie" element={<ConnectedInCrisisPage/>}/>
          <Route path="/podopieczni" element={<BeneficiariesPage />} />
          <Route path="/sklep" element={<Shop />} />
          <Route path="/admin" element={<LoginPage />} />
          <Route path="/raporty-finansowe" element={<FinancialReportsPage/>}/>
          <Route path="/app" element={<AppLogin />} />
          <Route path="/app/accept" element={<AcceptInvite />} />
          <Route path="/app/profil-pacjenta" element={<PatientProfile />} />
          <Route path="/app/leki" element={<Medications />} />
          <Route path="/app/kalkulator-inr" element={<InrCalculator />} />
          <Route path="/app/pomiary" element={<Pomiary />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isAppSection && <Footer />}
    </>
  );
}

export default function App() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const btn = (e.target as Element).closest('button:not(.MuiButtonBase-root)') as HTMLElement | null;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const bg = getComputedStyle(btn).backgroundColor;
      const isTransparent = bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
      const color = isTransparent ? 'rgba(35, 131, 197, 0.4)' : 'rgba(255, 255, 255, 0.6)';

      const dot = document.createElement('span');
      dot.className = 'btn-ripple-dot';
      Object.assign(dot.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}px`,
        top: `${y}px`,
        background: color,
      });

      btn.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

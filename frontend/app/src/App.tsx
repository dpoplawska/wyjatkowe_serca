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
import PatientProfile from './app/PatientProfile.tsx';

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
          <Route path="/zbiorka/hubert_szymborski" element={<CharityFundraser specialFundraiser={true} beneficiary='hubert_szymborski' />} />
          <Route path="/zbiorka/danuta_grzyb" element={<CharityFundraser specialFundraiser={true} beneficiary='danuta_grzyb' />} />
          <Route path="/zbiorka/franciszek_grzyb" element={<CharityFundraser specialFundraiser={true} beneficiary='franciszek_grzyb' />} />
          <Route path="/zbiorka/cyprian_zawadzki" element={<CharityFundraser specialFundraiser={true} beneficiary='cyprian_zawadzki' />} />
          <Route path="/zbiorka/mikolaj_wegierski" element={<CharityFundraser specialFundraiser={true} beneficiary='mikolaj_wegierski'/>} />
          <Route path="/zbiorka/cecylia_suchocka" element={<CharityFundraser specialFundraiser={true} beneficiary='cecylia_suchocka' />} />
          <Route path="/zbiorka/nikodem_kochel" element={<CharityFundraser specialFundraiser={true} beneficiary='nikodem_kochel'/>} />
          <Route path="/zbiorka/agnieszka_ptaszek" element={<CharityFundraser specialFundraiser={true} beneficiary='agnieszka_ptaszek'/>} />
          <Route path="polaczeni_w_kryzysie" element={<ConnectedInCrisisPage/>}/>
          <Route path="/podopieczni" element={<BeneficiariesPage />} />
          <Route path="/sklep" element={<Shop />} />
          <Route path="/sklep/admin" element={<LoginPage />} />
          <Route path="/raporty-finansowe" element={<FinancialReportsPage/>}/>
          <Route path="/app" element={<AppLogin />} />
          <Route path="/app/profil-pacjenta" element={<PatientProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isAppSection && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

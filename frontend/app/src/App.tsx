import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Main from './sections/Main.tsx';
import Footer from './sections/Footer.tsx';
import ThankYou from './sections/ThankYou.tsx';
import CharityFundraser from './sections/CharityFundraiser.tsx';
import Shop from "./sections/Shop.tsx";
import LoginPage from './sections/LoginPage.tsx';
import Menu from './sections/Menu.tsx';

export default function App() {
  return (
    <Router>
      <div className="App">
        <Menu />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/dziekujemy" element={<ThankYou />} />
          <Route path="/zbiorka/fundacja" element={<CharityFundraser specialFundraiser={false} />} />
          <Route path="/zbiorka/hubert_szymborski" element={<CharityFundraser specialFundraiser={true} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/sklep" element={<Shop />} />
          <Route path="/sklep/admin" element={<LoginPage />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}
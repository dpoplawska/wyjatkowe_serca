import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Menu from './sections/Menu';
import Main from './sections/Main';
import Footer from './sections/Footer';
import ThankYou from './sections/ThankYou';
import CharityFundraser from './sections/CharityFundraiser';

function App() {
  return (
    <Router>
      <div className="App">
        <Menu />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/dziekujemy" element={<ThankYou />} />
          <Route path="/zbiorka/fundacja" element={<CharityFundraser />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;

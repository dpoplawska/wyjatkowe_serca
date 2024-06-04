import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Menu from './sections/Menu';
import Main from './sections/Main';
import Footer from './sections/Footer';
import ThankYou from './sections/ThankYou';

function App() {
  return (
    <Router>
      <div className="App">
        <Menu />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/thankyou" element={<ThankYou />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

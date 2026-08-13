import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MyPage from './pages/MyPage';
import Shopping from './pages/Shopping';
import Place from './pages/Place';
import PreTradeRitual from './pages/trading-rituals';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MyPage />} />
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/place" element={<Place />} />
        <Route path="/trading-rituals" element={<PreTradeRitual />} />
      </Routes>
    </Router>
  );
}

export default App;

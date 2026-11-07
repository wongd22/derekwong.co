import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MyPage from './pages/MyPage';
import Shopping from './pages/Shopping';
import Place from './pages/Place';
import PreTradeRitual from './pages/trading-rituals';
import Spending from './pages/Spending';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MyPage />} />
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/place" element={<Place />} />
        <Route path="/trading-rituals" element={<PreTradeRitual />} />
        <Route path="/spending" element={<Spending />} />
      </Routes>
    </Router>
  );
}

export default App;

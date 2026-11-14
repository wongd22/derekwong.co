import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MyPage from './pages/MyPage';
import Place from './pages/Place';
import PreTradeRitual from './pages/trading-rituals';
import Spending from './pages/Spending';

const Shopping = lazy(() => import('./pages/Shopping'));

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MyPage />} />
        <Route path="/shopping" element={
          <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <Shopping />
          </Suspense>
        } />
        <Route path="/place" element={<Place />} />
        <Route path="/trading-rituals" element={<PreTradeRitual />} />
        <Route path="/spending" element={<Spending />} />
      </Routes>
    </Router>
  );
}

export default App;

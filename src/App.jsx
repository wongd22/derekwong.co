import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MyPage from './pages/MyPage';
import Shopping from './pages/Shopping';
import Place from './pages/Place';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MyPage />} />
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/place" element={<Place />} />
      </Routes>
    </Router>
  );
}

export default App;

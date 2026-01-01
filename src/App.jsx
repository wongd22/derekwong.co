import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import MyPage from './pages/MyPage';

function App() {
  return (
    <Router>
      <MyPage />
    </Router>
  );
}

export default App;

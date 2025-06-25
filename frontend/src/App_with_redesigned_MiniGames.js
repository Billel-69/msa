import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MiniGames from './pages/MiniGames_redesigned'; 
// Import your other components
import './App.css';

// Context providers
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/mini-games" element={<MiniGames />} />
          {/* Add your other routes here */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

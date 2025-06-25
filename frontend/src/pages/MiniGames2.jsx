
// frontend/src/pages/MiniGames2.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MiniGames2.css';

// Sample data for games
const games = [
  {
    id: 'flash-cards',
    title: 'Flash Cards',
    description: 'Test your knowledge with our interactive flash cards.',
    image: '/asset/m1.png',
    path: '/flash-cards'
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Challenge yourself with quizzes on various subjects.',
    image: '/asset/m2.png',
    path: '/quiz'
  },
  {
    id: 'math-mayhem',
    title: 'Math Mayhem',
    description: 'Solve math problems against the clock.',
    image: '/asset/m3.png',
    path: '/math-mayhem'
  }
];

const MiniGames2 = () => {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="minigames2-page">
      <div className="mg2-container">
        <header className="mg2-header">
          <h1>Mini-Games</h1>
          <p>Select a game to play and learn.</p>
        </header>

        <main>
          <section className="mg2-section">
            <h2 className="mg2-section-title">Available Games</h2>
            <div className="mg2-grid">
              {games.map(game => (
                <div key={game.id} className="mg2-game-card" onClick={() => handleCardClick(game.path)}>
                  <img src={game.image} alt={game.title} className="mg2-card-image" />
                  <h3 className="mg2-card-title">{game.title}</h3>
                  <p className="mg2-card-description">{game.description}</p>
                  <span className="mg2-card-button">Play Now</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default MiniGames2;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaGamepad, FaPlay, FaArrowLeft } from 'react-icons/fa';
import './MiniGames.css';

const MiniGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/games/available', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGames(response.data.games || []);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des mini-jeux.');
        setLoading(false);
      }
    };
    fetchGames();
  }, [token]);

  if (loading) {
    return (
      <div className="minigames-page">
        <div className="minigames-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Chargement des mini-jeux...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="minigames-page">
        <div className="minigames-container">
          <div className="error-state">
            <h2>Erreur</h2>
            <p>{error}</p>
            <button className="btn-retry" onClick={() => window.location.reload()}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="minigames-page">
      <div className="minigames-container">
        <button className="back-button" onClick={() => navigate('/')}> <FaArrowLeft /> Retour à l'accueil </button>
        <div className="minigames-hero">
          <div className="minigames-hero-content">
            <h1><FaGamepad /> Mini-Jeux Éducatifs</h1>
            <p>Choisis un mini-jeu pour tester tes connaissances et gagner de l'XP!</p>
          </div>
        </div>
        <div className="minigames-grid">
          {games.length > 0 ? (
            games.map(game => (
              <div
                key={game._id}
                className={`minigames-card${hovered === game._id ? ' hovered' : ''}`}
                onMouseEnter={() => setHovered(game._id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="card-glow" style={{ opacity: hovered === game._id ? 1 : 0 }}></div>
                <div className="minigames-card-img">
                  <img src={game.imageUrl || '/assets/default-game.png'} alt={game.name} />
                </div>
                <h3>{game.name}</h3>
                <div className="minigames-card-subject">{game.subject}</div>
                <p>{game.description}</p>
                <div className="minigames-card-stats">
                  <div className="minigames-stat">
                    <strong>Difficulté</strong>
                    <div className="stat-value"><span>{game.difficulty}</span></div>
                  </div>
                  <div className="minigames-stat">
                    <strong>Récompense</strong>
                    <div className="stat-value"><span>{game.xpReward} XP</span></div>
                  </div>
                </div>
                <button className="minigames-play-btn" onClick={() => navigate(`/jeu/${game._id}`)}>
                  <FaPlay /> <span>Jouer</span>
                </button>
              </div>
            ))
          ) : (
            <div className="no-games-message">
              <h3>Aucun mini-jeu disponible pour le moment</h3>
              <p>Reviens bientôt pour découvrir nos nouveaux jeux éducatifs!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniGames;

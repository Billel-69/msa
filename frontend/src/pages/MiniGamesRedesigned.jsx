import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaGamepad, FaTrophy, FaStar, FaBolt, FaPlay, 
  FaRocket, FaExclamationTriangle, FaAward, FaCrown
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './MiniGames_New.css';

const MiniGamesRedesigned = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const handlePlayGame = (route) => {
    navigate(route);
  };

  const fetchAvailableGames = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/games/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGames(data.games || []);
      } else {
        setError('Erreur lors du chargement des mini-jeux');
      }
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAvailableGames();
  }, [fetchAvailableGames]);

  if (loading) {
    return (
      <div className="mini-games-container">
        <div className="loading-container">
          <div className="loading-animation">
            <div className="loader-circle"></div>
            <div className="loader-line-mask">
              <div className="loader-line"></div>
            </div>
          </div>
          <h2 className="loading-text">Chargement des mini-jeux...</h2>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mini-games-container">
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h2>Oups! Une erreur est survenue</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchAvailableGames}>
            <FaRocket /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mini-games-container">
      {/* Header Section */}
      <div className="games-header">
        <div className="header-content">
          <h1><FaGamepad /> Mini-Jeux Éducatifs</h1>
          <p>Choisis un mini-jeu pour tester tes connaissances et gagner de l'XP magique!</p>
          <div className="header-stats">
            <div className="stat-bubble">
              <FaStar />
              <span>+{(games.length + 1) * 50} XP possible</span>
            </div>
            <div className="stat-bubble">
              <FaTrophy />
              <span>4 récompenses à débloquer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="games-grid">
        {/* Flash Cards - Featured Game */}
        <div 
          className={`game-card featured ${activeCard === 'flash-cards' ? 'active' : ''}`}
          onMouseEnter={() => setActiveCard('flash-cards')}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="card-overlay"></div>
          <div className="card-badge">
            <FaBolt /> Populaire
          </div>
          <div className="game-icon">🃏</div>
          <h2 className="game-title">Cartes Mémoire</h2>
          <p className="game-description">Réponds rapidement aux questions de mathématiques, sciences, histoire et géographie!</p>
          
          <div className="game-stats">
            <div className="stat-box">
              <div className="stat-label">Sujets</div>
              <div className="stat-value">4</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">XP par question</div>
              <div className="stat-value">10</div>
            </div>
          </div>
          
          <button 
            className="play-button"
            onClick={() => handlePlayGame('/flash-cards')}
            aria-label="Jouer aux Cartes Mémoire"
          >
            <FaPlay /> Jouer Maintenant
          </button>
        </div>

        {/* Backend Games */}
        {games.map((game) => (
          <div 
            key={game.id} 
            className={`game-card ${activeCard === game.id ? 'active' : ''}`}
            onMouseEnter={() => setActiveCard(game.id)}
            onMouseLeave={() => setActiveCard(null)}
          >
            <div className="card-overlay"></div>
            <div className="game-icon">🎮</div>
            <h2 className="game-title">{game.name}</h2>
            <p className="game-description">{game.description}</p>
            
            <div className="game-stats">
              <div className="stat-box">
                <div className="stat-label">Score Max</div>
                <div className="stat-value">{game.max_score}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">XP par question</div>
                <div className="stat-value">{game.xp_per_question}</div>
              </div>
            </div>
            
            <div className="coming-soon-badge">
              🔧 Bientôt disponible
            </div>
          </div>
        ))}

        {/* Placeholder Cards */}
        <div 
          className={`game-card ${activeCard === 'quiz' ? 'active' : ''}`}
          onMouseEnter={() => setActiveCard('quiz')}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="card-overlay"></div>
          <div className="game-icon">🧩</div>
          <h2 className="game-title">Quiz Interactif</h2>
          <p className="game-description">Questions à choix multiple avec timer et classements en temps réel</p>
          
          <div className="game-features">
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Timer en temps réel</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Classements</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Mode multijoueur</span>
            </div>
          </div>
          
          <div className="coming-soon-badge">
            🔧 En développement
          </div>
        </div>

        <div 
          className={`game-card ${activeCard === 'math' ? 'active' : ''}`}
          onMouseEnter={() => setActiveCard('math')}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="card-overlay"></div>
          <div className="game-icon">🎲</div>
          <h2 className="game-title">Défi Mathématique</h2>
          <p className="game-description">Résous des équations et des problèmes de logique contre la montre</p>
          
          <div className="game-features">
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Équations dynamiques</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Niveaux adaptatifs</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Bonus de vitesse</span>
            </div>
          </div>
          
          <div className="coming-soon-badge">
            🔧 En développement
          </div>
        </div>

        <div 
          className={`game-card ${activeCard === 'geo' ? 'active' : ''}`}
          onMouseEnter={() => setActiveCard('geo')}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="card-overlay"></div>
          <div className="game-icon">🗺️</div>
          <h2 className="game-title">Explorateur Géographique</h2>
          <p className="game-description">Découvre le monde à travers des cartes interactives et des défis</p>
          
          <div className="game-features">
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Cartes interactives</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Mode exploration</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Défis géographiques</span>
            </div>
          </div>
          
          <div className="coming-soon-badge">
            🔧 En développement
          </div>
        </div>

        <div 
          className={`game-card ${activeCard === 'memory' ? 'active' : ''}`}
          onMouseEnter={() => setActiveCard('memory')}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="card-overlay"></div>
          <div className="game-icon">🧠</div>
          <h2 className="game-title">Maître de la Mémoire</h2>
          <p className="game-description">Entraîne ta mémoire avec des séquences, patterns et associations</p>
          
          <div className="game-features">
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Jeux de séquences</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Memory cards</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Patterns visuels</span>
            </div>
          </div>
          
          <div className="coming-soon-badge">
            🔮 Bientôt disponible
          </div>
        </div>

        <div 
          className={`game-card ${activeCard === 'puzzle' ? 'active' : ''}`}
          onMouseEnter={() => setActiveCard('puzzle')}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="card-overlay"></div>
          <div className="game-icon">🔍</div>
          <h2 className="game-title">Puzzle Mystère</h2>
          <p className="game-description">Résous des énigmes et des casse-têtes pour débloquer des secrets</p>
          
          <div className="game-features">
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Énigmes logiques</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Casse-têtes visuels</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Histoires mystères</span>
            </div>
          </div>
          
          <div className="coming-soon-badge">
            🔮 Bientôt disponible
          </div>
        </div>

        <div 
          className={`game-card ${activeCard === 'language' ? 'active' : ''}`}
          onMouseEnter={() => setActiveCard('language')}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="card-overlay"></div>
          <div className="game-icon">🗣️</div>
          <h2 className="game-title">Polyglotte Magique</h2>
          <p className="game-description">Apprends les langues avec des mini-jeux interactifs et amusants</p>
          
          <div className="game-features">
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Vocabulaire interactif</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Reconnaissance vocale</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot">•</span>
              <span>Conversations guidées</span>
            </div>
          </div>
          
          <div className="coming-soon-badge">
            🔮 Bientôt disponible
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="games-footer">
        <div className="footer-section">
          <h2><FaTrophy /> Récompenses Magiques</h2>
          <div className="achievements-grid">
            <div className="achievement bronze">
              <div className="achievement-badge">🥉</div>
              <div className="achievement-details">
                <h3>Première Victoire</h3>
                <div className="progress-bar">
                  <div className="progress" style={{width: '0%'}}></div>
                </div>
                <div className="progress-text">0/1</div>
              </div>
            </div>
            
            <div className="achievement silver">
              <div className="achievement-badge">🥈</div>
              <div className="achievement-details">
                <h3>Maître des Sessions</h3>
                <div className="progress-bar">
                  <div className="progress" style={{width: '0%'}}></div>
                </div>
                <div className="progress-text">0/10</div>
              </div>
            </div>
            
            <div className="achievement gold">
              <div className="achievement-badge">🥇</div>
              <div className="achievement-details">
                <h3>Score Parfait</h3>
                <div className="progress-bar">
                  <div className="progress" style={{width: '0%'}}></div>
                </div>
                <div className="progress-text">0/1</div>
              </div>
            </div>
            
            <div className="achievement platinum">
              <div className="achievement-badge">👑</div>
              <div className="achievement-details">
                <h3>Champion des Mini-Jeux</h3>
                <div className="progress-bar">
                  <div className="progress" style={{width: '0%'}}></div>
                </div>
                <div className="progress-text">0/100</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-section">
          <h2><FaStar /> Tes Prochains Objectifs</h2>
          <div className="goals-list">
            <div className="goal-item">
              <div className="goal-icon">
                <FaBolt />
              </div>
              <div className="goal-text">
                Compléter ta première session de Cartes Mémoire
              </div>
            </div>
            
            <div className="goal-item">
              <div className="goal-icon">
                <FaAward />
              </div>
              <div className="goal-text">
                Atteindre un score de 80% ou plus dans un jeu
              </div>
            </div>
            
            <div className="goal-item">
              <div className="goal-icon">
                <FaCrown />
              </div>
              <div className="goal-text">
                Gagner 100 XP en jouant aux mini-jeux
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniGamesRedesigned;

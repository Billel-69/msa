import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaGamepad, FaRocket, FaTrophy, FaStar, FaBolt, FaPlay,
  FaClock, FaChartLine, FaBook, FaPuzzlePiece, FaGraduationCap
} from 'react-icons/fa';
import './MiniGamesNew.css';

const MiniGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Flash Cards navigation handler
  const handlePlayFlashCards = () => {
    console.log('Navigating to /flash-cards...');
    navigate('/flash-cards');
  };

  // Games data fetching
  useEffect(() => {
    const fetchGames = async () => {
      try {
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
        setError('Erreur de connexion au serveur');
        console.error('Error fetching games:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="minigames-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <h3>Chargement des mini-jeux...</h3>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="minigames-container">
        <div className="error-screen">
          <FaRocket className="error-icon" />
          <h2>Oups! Une erreur est survenue</h2>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Featured games - hardcoded for now
  const featuredGames = [
    {
      id: 'flash-cards',
      name: 'Cartes Mémoire Magiques',
      description: 'Réponds rapidement aux questions de mathématiques, sciences, histoire et géographie!',
      icon: '🃏',
      subjectCount: 4,
      xpPerQuestion: 10,
      available: true,
      featured: true,
      stats: [
        { label: 'Sujets', value: '4' },
        { label: 'XP par question', value: '10' }
      ],
      action: handlePlayFlashCards
    },
    {
      id: 'quiz',
      name: 'Quiz Interactif',
      description: 'Questions à choix multiple avec timer et classements en temps réel',
      icon: '🧩',
      available: false,
      features: ['Timer en temps réel', 'Classements', 'Mode multijoueur'],
      stats: [
        { label: 'Niveaux', value: '5' },
        { label: 'XP par quiz', value: '50' }
      ]
    },
    {
      id: 'math-challenge',
      name: 'Défi Mathématique',
      description: 'Résous des équations et problèmes de logique contre la montre',
      icon: '🎲',
      available: false,
      features: ['Équations dynamiques', 'Niveaux adaptatifs', 'Bonus de vitesse'],
      stats: [
        { label: 'Difficulté', value: '1-5' },
        { label: 'XP par défi', value: '15' }
      ]
    },
    {
      id: 'geography',
      name: 'Explorateur Géographique',
      description: 'Découvre le monde à travers des cartes interactives et des défis',
      icon: '🗺️',
      available: false,
      features: ['Cartes interactives', 'Mode exploration', 'Défis géographiques'],
      stats: [
        { label: 'Régions', value: '6' },
        { label: 'XP par lieu', value: '8' }
      ]
    },
    {
      id: 'memory',
      name: 'Maître de la Mémoire',
      description: 'Entraîne ta mémoire avec des séquences et patterns visuels',
      icon: '🧠',
      available: false,
      features: ['Jeux de séquences', 'Memory cards', 'Patterns visuels'],
      stats: [
        { label: 'Niveaux', value: '8' },
        { label: 'XP par niveau', value: '25' }
      ]
    },
    {
      id: 'puzzle',
      name: 'Puzzle Mystère',
      description: 'Résous des énigmes pour débloquer des secrets',
      icon: '🔍',
      available: false,
      features: ['Énigmes logiques', 'Casse-têtes visuels', 'Histoires mystères'],
      stats: [
        { label: 'Énigmes', value: '12' },
        { label: 'XP par énigme', value: '30' }
      ]
    }
  ];

  // Combine backend games with featured games
  const allGames = [...featuredGames];
  
  // Add any backend games that aren't already included
  games.forEach(backendGame => {
    if (!allGames.find(game => game.id === backendGame.id)) {
      allGames.push({
        ...backendGame,
        stats: [
          { label: 'Score Max', value: backendGame.max_score },
          { label: 'XP par question', value: backendGame.xp_per_question }
        ],
        available: false
      });
    }
  });

  return (
    <div className="minigames-container">
      {/* Hero Section */}
      <div className="minigames-hero">
        <div className="hero-content">
          <h1><FaGamepad /> Mini-Jeux Éducatifs</h1>
          <p>Apprends en t'amusant avec nos mini-jeux et gagne de l'XP magique!</p>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <FaStar className="hero-stat-icon" />
              <div className="hero-stat-content">
                <span className="hero-stat-value">+{allGames.length * 50}</span>
                <span className="hero-stat-label">XP possible</span>
              </div>
            </div>
            <div className="hero-stat">
              <FaTrophy className="hero-stat-icon" />
              <div className="hero-stat-content">
                <span className="hero-stat-value">4</span>
                <span className="hero-stat-label">Récompenses</span>
              </div>
            </div>
            <div className="hero-stat">
              <FaGraduationCap className="hero-stat-icon" />
              <div className="hero-stat-content">
                <span className="hero-stat-value">{allGames.length}</span>
                <span className="hero-stat-label">Jeux</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="games-section">
        <h2>Nos Mini-Jeux</h2>
        <div className="games-grid">
          {allGames.map(game => (
            <div 
              key={game.id}
              className={`game-card ${game.featured ? 'featured' : ''} ${activeGame === game.id ? 'active' : ''}`}
              onMouseEnter={() => setActiveGame(game.id)}
              onMouseLeave={() => setActiveGame(null)}
            >
              {game.featured && (
                <div className="featured-badge">
                  <FaBolt />
                  <span>Populaire</span>
                </div>
              )}
              
              <div className="game-icon">{game.icon}</div>
              <h3>{game.name}</h3>
              <p className="game-description">{game.description}</p>
              
              {/* Stats Section - Fixed Layout */}
              <div className="game-stats-container">
                {game.stats && game.stats.map((stat, index) => (
                  <div className="game-stat-box" key={index}>
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-value">{stat.value}</div>
                  </div>
                ))}
              </div>
              
              {/* Features for upcoming games */}
              {!game.available && game.features && (
                <div className="game-features">
                  {game.features.map((feature, index) => (
                    <div className="feature-item" key={index}>
                      <span className="feature-dot">•</span> {feature}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Action button or coming soon badge */}
              <div className="game-action">
                {game.available ? (
                  <button 
                    className="play-button"
                    onClick={game.action}
                  >
                    <FaPlay /> Jouer Maintenant
                    {activeGame === game.id && <div className="button-glow"></div>}
                  </button>
                ) : (
                  <div className="coming-soon-badge">
                    🔧 Bientôt Disponible
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="achievements-section">
        <h2><FaTrophy /> Récompenses à Débloquer</h2>
        
        <div className="achievements-grid">
          <div className="achievement bronze">
            <div className="achievement-medal">🥉</div>
            <h4>Première Victoire</h4>
            <div className="achievement-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '0%'}}></div>
              </div>
              <span>0/1</span>
            </div>
          </div>
          
          <div className="achievement silver">
            <div className="achievement-medal">🥈</div>
            <h4>Maître des Sessions</h4>
            <div className="achievement-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '0%'}}></div>
              </div>
              <span>0/10</span>
            </div>
          </div>
          
          <div className="achievement gold">
            <div className="achievement-medal">🥇</div>
            <h4>Score Parfait</h4>
            <div className="achievement-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '0%'}}></div>
              </div>
              <span>0/1</span>
            </div>
          </div>
          
          <div className="achievement legendary">
            <div className="achievement-medal">👑</div>
            <h4>Champion des Mini-Jeux</h4>
            <div className="achievement-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '0%'}}></div>
              </div>
              <span>0/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="goals-section">
        <h2><FaChartLine /> Tes Prochains Objectifs</h2>
        
        <div className="goals-grid">
          <div className="goal-card">
            <FaPlay className="goal-icon" />
            <p>Compléter ta première session Flash Cards</p>
          </div>
          
          <div className="goal-card">
            <FaTrophy className="goal-icon" />
            <p>Atteindre un score de 80% ou plus</p>
          </div>
          
          <div className="goal-card">
            <FaStar className="goal-icon" />
            <p>Gagner 100 XP dans les mini-jeux</p>
          </div>
          
          <div className="goal-card">
            <FaBolt className="goal-icon" />
            <p>Créer une série de 5 bonnes réponses</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniGames;

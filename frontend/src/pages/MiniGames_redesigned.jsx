import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaGamepad, FaRocket, FaTrophy, FaStar, FaBolt, 
  FaPlay, FaChartLine, FaAward, FaGraduationCap 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './MiniGames_redesigned.css';

const MiniGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handlePlayFlashCards = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Navigating to /flash-cards...');
    try {
      navigate('/flash-cards');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const fetchAvailableGames = useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAvailableGames();
  }, [fetchAvailableGames]);

  if (loading) {
    return (
      <div className="minigames-container">
        <div className="minigames-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des mini-jeux magiques...</p>
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
      <div className="minigames-container">
        <div className="minigames-error">
          <h2>😕 Oups!</h2>
          <p>{error}</p>
          <button onClick={fetchAvailableGames} className="minigames-button retry-button">
            <FaRocket /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="minigames-container">
      {/* Header section */}
      <header className="minigames-header">
        <h1><FaGamepad className="header-icon" /> Mini-Jeux Éducatifs</h1>
        <p>Choisis un mini-jeu pour tester tes connaissances et gagner de l'XP magique! 🌟</p>
        
        <div className="header-stats">
          <div className="stat-bubble">
            <FaStar className="stat-icon" />
            <span>+{games.length * 50} XP possible</span>
          </div>
          <div className="stat-bubble">
            <FaTrophy className="stat-icon" />
            <span>4 récompenses</span>
          </div>
        </div>
      </header>

      {/* Games grid */}
      <div className="minigames-grid">
        {/* Flash Cards Game Card - Featured */}
        <div 
          className="game-card featured"
          onMouseEnter={() => setHoveredCard('flash-cards')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="card-glow"></div>
          <div className="featured-badge">
            <FaBolt /> Populaire
          </div>
          
          <div className="card-content">
            <div className="game-icon">🃏</div>
            <h3>Flash Cards</h3>
            <p>Réponds rapidement aux questions de mathématiques, sciences, histoire et géographie!</p>
            
            <div className="game-stats-container">
              <div className="game-stat">
                <div className="stat-label">Sujets</div>
                <div className="stat-value">4</div>
              </div>
              <div className="game-stat">
                <div className="stat-label">XP par question</div>
                <div className="stat-value">10</div>
              </div>
            </div>

            <button 
              onClick={handlePlayFlashCards}
              className="play-button"
              aria-label="Lancer le jeu Flash Cards"
            >
              <FaPlay className="button-icon" />
              <span>Jouer Maintenant</span>
              {hoveredCard === 'flash-cards' && <span className="button-sparkle"></span>}
            </button>
          </div>
        </div>

        {/* Backend-provided games */}
        {games.map((game) => (
          <div 
            key={game.id} 
            className="game-card"
            onMouseEnter={() => setHoveredCard(game.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="card-glow"></div>
            
            <div className="card-content">
              <div className="game-icon">🎯</div>
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              
              <div className="game-stats-container">
                <div className="game-stat">
                  <div className="stat-label">Score Max</div>
                  <div className="stat-value">{game.max_score}</div>
                </div>
                <div className="game-stat">
                  <div className="stat-label">XP par question</div>
                  <div className="stat-value">{game.xp_per_question}</div>
                </div>
              </div>

              <div className="coming-soon-badge">
                🔧 Bientôt disponible
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder games with improved layout */}
        <GamePlaceholder 
          icon="🧩" 
          title="Quiz Interactif" 
          description="Questions à choix multiple avec timer et classements en temps réel"
          features={["Timer en temps réel", "Classements", "Mode multijoueur"]}
          status="🔧 En développement"
          setHoveredCard={setHoveredCard}
          id="quiz"
          hoveredCard={hoveredCard}
        />

        <GamePlaceholder 
          icon="🎲" 
          title="Défi Mathématique" 
          description="Résous des équations et des problèmes de logique contre la montre"
          features={["Équations dynamiques", "Niveaux adaptatifs", "Bonus de vitesse"]}
          status="🔧 En développement"
          setHoveredCard={setHoveredCard}
          id="math"
          hoveredCard={hoveredCard}
        />

        <GamePlaceholder 
          icon="🗺️" 
          title="Explorateur Géographique" 
          description="Découvre le monde à travers des cartes interactives et des défis"
          features={["Cartes interactives", "Mode exploration", "Défis géographiques"]}
          status="🔧 En développement"
          setHoveredCard={setHoveredCard}
          id="geo"
          hoveredCard={hoveredCard}
        />

        <GamePlaceholder 
          icon="🧠" 
          title="Maître de la Mémoire" 
          description="Entraîne ta mémoire avec des séquences, patterns et associations"
          features={["Jeux de séquences", "Memory cards", "Patterns visuels"]}
          status="🔮 Bientôt disponible"
          setHoveredCard={setHoveredCard}
          id="memory"
          hoveredCard={hoveredCard}
        />

        <GamePlaceholder 
          icon="🔍" 
          title="Puzzle Mystère" 
          description="Résous des énigmes et des casse-têtes pour débloquer des secrets"
          features={["Énigmes logiques", "Casse-têtes visuels", "Histoires mystères"]}
          status="🔮 Bientôt disponible"
          setHoveredCard={setHoveredCard}
          id="puzzle"
          hoveredCard={hoveredCard}
        />

        <GamePlaceholder 
          icon="🗣️" 
          title="Polyglotte Magique" 
          description="Apprends les langues avec des mini-jeux interactifs et amusants"
          features={["Vocabulaire interactif", "Reconnaissance vocale", "Conversations guidées"]}
          status="🔮 Bientôt disponible"
          setHoveredCard={setHoveredCard}
          id="language"
          hoveredCard={hoveredCard}
        />
      </div>

      {/* Footer with achievements and goals */}
      <footer className="minigames-footer">
        <div className="achievements-section">
          <h3><FaTrophy className="section-icon" /> Récompenses Magiques</h3>
          <div className="achievements-grid">
            <Achievement 
              level="bronze" 
              icon="🥉" 
              title="Première Victoire" 
              progress={0} 
              total={1} 
            />
            <Achievement 
              level="silver" 
              icon="🥈" 
              title="Maître des Sessions" 
              progress={0} 
              total={10} 
            />
            <Achievement 
              level="gold" 
              icon="🥇" 
              title="Score Parfait" 
              progress={0} 
              total={1} 
            />
            <Achievement 
              level="legendary" 
              icon="👑" 
              title="Champion des Mini-Jeux" 
              progress={0} 
              total={100} 
            />
          </div>
        </div>

        <div className="goals-section">
          <h3><FaStar className="section-icon" /> Tes Prochains Objectifs</h3>
          <div className="goals-grid">
            <Goal icon={<FaBolt />} text="Compléter ta première session Flash Cards" />
            <Goal icon={<FaTrophy />} text="Atteindre un score de 80% ou plus" />
            <Goal icon={<FaStar />} text="Gagner 100 XP dans les mini-jeux" />
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper component for game placeholders
const GamePlaceholder = ({ icon, title, description, features, status, setHoveredCard, id, hoveredCard }) => (
  <div 
    className="game-card placeholder"
    onMouseEnter={() => setHoveredCard(id)}
    onMouseLeave={() => setHoveredCard(null)}
  >
    <div className="card-glow"></div>
    
    <div className="card-content">
      <div className="game-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      
      <div className="features-list">
        {features.map((feature, index) => (
          <div className="feature-item" key={index}>
            <span className="feature-bullet">•</span> {feature}
          </div>
        ))}
      </div>

      <div className="coming-soon-badge">
        {status}
      </div>
    </div>
  </div>
);

// Helper component for achievements
const Achievement = ({ level, icon, title, progress, total }) => (
  <div className={`achievement ${level}`}>
    <span className="achievement-icon">{icon}</span>
    <span className="achievement-title">{title}</span>
    <div className="achievement-progress">
      <div className="progress-bar">
        <div className="progress-fill" style={{width: `${(progress/total)*100}%`}}></div>
      </div>
      <span className="progress-text">{progress}/{total}</span>
    </div>
  </div>
);

// Helper component for goals
const Goal = ({ icon, text }) => (
  <div className="goal-item">
    {icon}
    <span>{text}</span>
  </div>
);

export default MiniGames;

//MiniGames.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaGamepad, FaPlay, FaArrowLeft } from 'react-icons/fa';
import '../styles/MiniGames.css';

const MiniGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
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

  // Define French school levels (3e à Terminale seulement)
  const niveauxScolaires = [
    '3e', '2nde', '1ère', 'Terminale'
  ];
  const subjectsByLevel = {
    primaire: ['Mathématiques', 'Français', 'Histoire', 'Géographie', 'Anglais', 'Sciences'],
    college: ['Mathématiques', 'Français', 'Histoire-Géo', 'Anglais', 'Espagnol', 'Physique-Chimie', 'SVT', 'Technologie'],
    lycee: ['Mathématiques', 'Français', 'Philosophie', 'Histoire-Géo', 'Anglais', 'Espagnol', 'Physique-Chimie', 'SVT', 'SES', 'Spécialité']
  };
  function getSubjectsForLevel(niveau) {
    if (["3e"].includes(niveau)) return subjectsByLevel.college;
    return subjectsByLevel.lycee; // 2nde, 1ère, Terminale
  }

  const subjects = selectedNiveau ? getSubjectsForLevel(selectedNiveau) : [];

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
            <p>Choisis une matière et un niveau scolaire, puis teste tes connaissances pour gagner de l'XP selon tes bonnes réponses !</p>
          </div>
        </div>
        {/* Subject and Level Selectors */}
        <div className="minigames-selectors" style={{ display: 'flex', gap: 16, margin: '24px 0', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label htmlFor="niveau-select" style={{ color: '#b2eaff', fontWeight: 600, marginRight: 8 }}>Niveau scolaire :</label>
            <select id="niveau-select" value={selectedNiveau} onChange={e => { setSelectedNiveau(e.target.value); setSelectedSubject(''); }} style={{ borderRadius: 8, padding: '6px 12px', border: '1px solid #b2eaff', background: '#181a2a', color: '#fff' }}>
              <option value="">Tous</option>
              {niveauxScolaires.map(niveau => <option key={niveau} value={niveau}>{niveau}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="subject-select" style={{ color: '#b2eaff', fontWeight: 600, marginRight: 8 }}>Matière :</label>
            <select id="subject-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ borderRadius: 8, padding: '6px 12px', border: '1px solid #b2eaff', background: '#181a2a', color: '#fff' }} disabled={!selectedNiveau}>
              <option value="">Toutes</option>
              {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </div>
        </div>
        <div className="minigames-grid">
          {games.length > 0 ? (
            games.map(game => {
              // Quiz games and adventure games are available
              const isComingSoon = !['quiz', 'branching_adventure'].includes(game.type);
              
              return (
                <div
                  key={game.id}
                  className={`minigames-card${hovered === game.id ? ' hovered' : ''}${isComingSoon ? ' coming-soon' : ''}`}
                  onMouseEnter={() => setHovered(game.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="card-glow" style={{ opacity: hovered === game.id ? 1 : 0 }}></div>
                  {isComingSoon && <div className="coming-soon-overlay">Bientôt disponible</div>}
                  <div className="minigames-card-img">
                    <img src={game.imageUrl || '/assets/default-game.png'} alt={game.name} />
                  </div>
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <div style={{ fontSize: 12, color: '#b2eaff', marginBottom: 8 }}>
                    {isComingSoon ? 'En développement...' : 'Gagne de l\'XP pour chaque bonne réponse !'}
                  </div>
                  <button
                    className={`minigames-play-btn${isComingSoon ? ' disabled' : ''}`}
                    disabled={isComingSoon}
                    onClick={() => {
                      if (isComingSoon) return;
                      const normalizedSubject = selectedSubject ? selectedSubject.toLowerCase() : '';
                      const normalizedNiveau = selectedNiveau ? selectedNiveau : '';
                      const params = [];
                      if (normalizedSubject) params.push(`subject=${encodeURIComponent(normalizedSubject)}`);
                      if (normalizedNiveau) params.push(`niveau=${encodeURIComponent(normalizedNiveau)}`);
                      const query = params.length ? `?${params.join('&')}` : '';
                      
                      // Route to specific game using database ID
                      const gameRoute = `/jeu/${game.id}`;
                      
                      const url = `${gameRoute}${query}`;
                      navigate(url);
                    }}
                  >
                    <FaPlay /> <span>{isComingSoon ? 'Bientôt' : 'Jouer'}</span>
                  </button>
                </div>
              );
            })
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

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaGamepad, FaRocket, FaTrophy, FaStar, FaBolt, FaPlay, FaChartLine, FaRegLightbulb
} from 'react-icons/fa';
import './MiniGamesRefined.css';

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
        console.log('Button clicked! Navigating to /flash-cards...');
        try {
            navigate('/flash-cards');
            console.log('Navigation called successfully');
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
            <div className="minigames-page">
                <div className="minigames-container">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Chargement des mini-jeux magiques...</p>
                        <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
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
                        <h2>😕 Oups!</h2>
                        <p>{error}</p>
                        <button onClick={fetchAvailableGames} className="btn-primary">
                            <FaRocket /> Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="minigames-page">
            <div className="minigames-container">
                <div className="minigames-hero">
                    <div className="minigames-hero-content">
                        <h1><FaGamepad /> Mini-Jeux Éducatifs</h1>
                        <p>Choisis un mini-jeu pour tester tes connaissances et gagner de l'XP magique! 🌟</p>
                        <div className="hero-stats">
                            <div className="stat-bubble">
                                <FaStar />
                                <span>+{games.length * 50} XP possible</span>
                            </div>
                            <div className="stat-bubble">
                                <FaTrophy />
                                <span>4 récompenses</span>
                            </div>
                            <div className="stat-bubble">
                                <FaRegLightbulb />
                                <span>Améliore tes compétences</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="minigames-grid">
                    {/* Flash Cards Game Card - Featured */}
                    <div 
                        className="minigames-card featured"
                        onMouseEnter={() => setHoveredCard('flash-cards')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="featured-badge">
                            <FaBolt />
                            <span>Populaire</span>
                        </div>
                        <div className="card-content">
                            <div className="card-icon">🃏</div>
                            <h3>Cartes Mémoire</h3>
                            <p>Réponds rapidement aux questions de mathématiques, sciences, histoire et géographie!</p>
                            <div className="card-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Sujets</span>
                                    <div className="stat-value">4</div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">XP par question</span>
                                    <div className="stat-value">10</div>
                                </div>
                            </div>
                            <button 
                                onClick={handlePlayFlashCards}
                                className="btn-play"
                                aria-label="Lancer le jeu Cartes Mémoire"
                            >
                                <FaPlay />
                                <span>Jouer Maintenant</span>
                                {hoveredCard === 'flash-cards' && <span className="btn-sparkle"></span>}
                            </button>
                        </div>
                    </div>

                    {/* Show available games from backend */}
                    {games.map((game) => (
                        <div 
                            key={game.id} 
                            className="minigames-card"
                            onMouseEnter={() => setHoveredCard(game.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <div className="card-content">
                                <div className="card-icon">🎯</div>
                                <h3>{game.name}</h3>
                                <p>{game.description}</p>
                                <div className="card-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Score Max</span>
                                        <div className="stat-value">{game.max_score}</div>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">XP par question</span>
                                        <div className="stat-value">{game.xp_per_question}</div>
                                    </div>
                                </div>
                                <div className="coming-soon">
                                    🔧 Bientôt disponible
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Enhanced placeholder cards */}
                    <div 
                        className="minigames-card upcoming"
                        onMouseEnter={() => setHoveredCard('quiz')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="card-content">
                            <div className="card-icon">🧩</div>
                            <h3>Quiz Interactif</h3>
                            <p>Questions à choix multiple avec timer et classements en temps réel</p>
                            <div className="feature-list">
                                <span>• Timer en temps réel</span>
                                <span>• Classements</span>
                                <span>• Mode multijoueur</span>
                            </div>
                            <div className="coming-soon">
                                🔧 En développement
                            </div>
                        </div>
                    </div>

                    <div 
                        className="minigames-card upcoming"
                        onMouseEnter={() => setHoveredCard('math')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="card-content">
                            <div className="card-icon">🎲</div>
                            <h3>Défi Mathématique</h3>
                            <p>Résous des équations et des problèmes de logique contre la montre</p>
                            <div className="feature-list">
                                <span>• Équations dynamiques</span>
                                <span>• Niveaux adaptatifs</span>
                                <span>• Bonus de vitesse</span>
                            </div>
                            <div className="coming-soon">
                                🔧 En développement
                            </div>
                        </div>
                    </div>

                    <div 
                        className="minigames-card upcoming"
                        onMouseEnter={() => setHoveredCard('geo')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="card-content">
                            <div className="card-icon">🗺️</div>
                            <h3>Explorateur Géographique</h3>
                            <p>Découvre le monde à travers des cartes interactives et des défis</p>
                            <div className="feature-list">
                                <span>• Cartes interactives</span>
                                <span>• Mode exploration</span>
                                <span>• Défis géographiques</span>
                            </div>
                            <div className="coming-soon">
                                🔧 En développement
                            </div>
                        </div>
                    </div>

                    <div 
                        className="minigames-card upcoming"
                        onMouseEnter={() => setHoveredCard('memory')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="card-content">
                            <div className="card-icon">🧠</div>
                            <h3>Maître de la Mémoire</h3>
                            <p>Entraîne ta mémoire avec des séquences, patterns et associations</p>
                            <div className="feature-list">
                                <span>• Jeux de séquences</span>
                                <span>• Memory cards</span>
                                <span>• Patterns visuels</span>
                            </div>
                            <div className="coming-soon">
                                🔮 Bientôt disponible
                            </div>
                        </div>
                    </div>

                    <div 
                        className="minigames-card upcoming"
                        onMouseEnter={() => setHoveredCard('puzzle')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="card-content">
                            <div className="card-icon">🔍</div>
                            <h3>Puzzle Mystère</h3>
                            <p>Résous des énigmes et des casse-têtes pour débloquer des secrets</p>
                            <div className="feature-list">
                                <span>• Énigmes logiques</span>
                                <span>• Casse-têtes visuels</span>
                                <span>• Histoires mystères</span>
                            </div>
                            <div className="coming-soon">
                                🔮 Bientôt disponible
                            </div>
                        </div>
                    </div>

                    <div 
                        className="minigames-card upcoming"
                        onMouseEnter={() => setHoveredCard('language')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="card-content">
                            <div className="card-icon">🗣️</div>
                            <h3>Polyglotte Magique</h3>
                            <p>Apprends les langues avec des mini-jeux interactifs et amusants</p>
                            <div className="feature-list">
                                <span>• Vocabulaire interactif</span>
                                <span>• Reconnaissance vocale</span>
                                <span>• Conversations guidées</span>
                            </div>
                            <div className="coming-soon">
                                🔮 Bientôt disponible
                            </div>
                        </div>
                    </div>
                </div>

                <div className="minigames-footer">
                    <div className="achievement-section">
                        <h3><FaTrophy /> Récompenses Magiques</h3>
                        <div className="achievements-grid">
                            <div className="achievement bronze">
                                <div className="achievement-badge">🥉</div>
                                <div className="achievement-info">
                                    <div className="achievement-title">Première Victoire</div>
                                    <div className="achievement-progress">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{width: '0%'}}></div>
                                        </div>
                                        <span className="progress-text">0/1</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="achievement silver">
                                <div className="achievement-badge">🥈</div>
                                <div className="achievement-info">
                                    <div className="achievement-title">Maître des Sessions</div>
                                    <div className="achievement-progress">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{width: '0%'}}></div>
                                        </div>
                                        <span className="progress-text">0/10</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="achievement gold">
                                <div className="achievement-badge">🥇</div>
                                <div className="achievement-info">
                                    <div className="achievement-title">Score Parfait</div>
                                    <div className="achievement-progress">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{width: '0%'}}></div>
                                        </div>
                                        <span className="progress-text">0/1</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="achievement legendary">
                                <div className="achievement-badge">👑</div>
                                <div className="achievement-info">
                                    <div className="achievement-title">Champion des Mini-Jeux</div>
                                    <div className="achievement-progress">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{width: '0%'}}></div>
                                        </div>
                                        <span className="progress-text">0/100</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="goals-section">
                        <h3><FaChartLine /> Tes Prochains Objectifs</h3>
                        <div className="goals-list">
                            <div className="goal-item">
                                <FaBolt />
                                <span>Compléter ta première session Flash Cards</span>
                            </div>
                            <div className="goal-item">
                                <FaTrophy />
                                <span>Atteindre un score de 80% ou plus</span>
                            </div>
                            <div className="goal-item">
                                <FaStar />
                                <span>Gagner 100 XP dans les mini-jeux</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiniGames;

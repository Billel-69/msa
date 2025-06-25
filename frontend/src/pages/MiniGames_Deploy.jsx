// MiniGames_Deploy.js
// Instructions for deployment:
// 1. Rename this file to MiniGames.jsx, replacing the current version
// 2. Ensure MiniGames_Redesign.css is in the same folder

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGamepad, FaRocket, FaTrophy, FaStar, FaBolt, FaPlay, FaChartLine, FaMedal } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './MiniGames_Redesign.css';

const MiniGames = () => {
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

    // Placeholder games data for a consistent UI
    const placeholderGames = [
        {
            id: 'quiz',
            icon: '🧩',
            name: 'Quiz Interactif',
            description: 'Questions à choix multiple avec timer et classements en temps réel',
            features: [
                'Timer en temps réel',
                'Classements',
                'Mode multijoueur'
            ]
        },
        {
            id: 'math',
            icon: '🎲',
            name: 'Défi Mathématique',
            description: 'Résous des équations et des problèmes de logique contre la montre',
            features: [
                'Équations dynamiques',
                'Niveaux adaptatifs',
                'Bonus de vitesse'
            ]
        },
        {
            id: 'geo',
            icon: '🗺️',
            name: 'Explorateur Géographique',
            description: 'Découvre le monde à travers des cartes interactives et des défis',
            features: [
                'Cartes interactives',
                'Mode exploration',
                'Défis géographiques'
            ]
        },
        {
            id: 'memory',
            icon: '🧠',
            name: 'Maître de la Mémoire',
            description: 'Entraîne ta mémoire avec des séquences, patterns et associations',
            features: [
                'Jeux de séquences',
                'Memory cards',
                'Patterns visuels'
            ]
        },
        {
            id: 'puzzle',
            icon: '🔍',
            name: 'Puzzle Mystère',
            description: 'Résous des énigmes et des casse-têtes pour débloquer des secrets',
            features: [
                'Énigmes logiques',
                'Casse-têtes visuels',
                'Histoires mystères'
            ]
        },
        {
            id: 'language',
            icon: '🗣️',
            name: 'Polyglotte Magique',
            description: 'Apprends les langues avec des mini-jeux interactifs et amusants',
            features: [
                'Vocabulaire interactif',
                'Reconnaissance vocale',
                'Conversations guidées'
            ]
        }
    ];
    
    // Loading state with animation
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
                    <h3 className="loading-text">Chargement des mini-jeux magiques...</h3>
                    <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="mini-games-container">
                <div className="error-container">
                    <div className="error-icon">😕</div>
                    <h2>Oups! Quelque chose s'est mal passé</h2>
                    <p>{error}</p>
                    <button onClick={fetchAvailableGames} className="retry-button">
                        <FaRocket /> Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mini-games-container">
            <div className="games-header">
                <div className="header-content">
                    <h1><FaGamepad /> Mini-Jeux Éducatifs</h1>
                    <p>Choisis un mini-jeu pour tester tes connaissances et gagner de l'XP magique! 🌟</p>
                    
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

            <div className="games-grid">
                {/* Featured Flash Cards Game */}
                <div 
                    className={`game-card featured ${activeCard === 'flash-cards' ? 'active' : ''}`}
                    onMouseEnter={() => setActiveCard('flash-cards')}
                    onMouseLeave={() => setActiveCard(null)}
                >
                    <div className="card-overlay"></div>
                    <div className="card-badge">
                        <FaBolt />
                        <span>Populaire</span>
                    </div>
                    <div className="game-icon">{'\u{1F0CF}'}</div>
                    <h2 className="game-title">Cartes Mémoire Magiques</h2>
                    <p className="game-description">
                        Réponds rapidement aux questions de mathématiques, sciences, histoire et géographie!
                    </p>
                    
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
                        aria-label="Jouer aux Cartes Mémoire Magiques"
                    >
                        <FaPlay />
                        <span>Jouer Maintenant</span>
                    </button>
                </div>

                {/* Backend games */}
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
                            <span>🔧 Bientôt disponible</span>
                        </div>
                    </div>
                ))}

                {/* Placeholder games for UI */}
                {placeholderGames.map((game) => (
                    <div 
                        key={game.id} 
                        className={`game-card placeholder ${activeCard === game.id ? 'active' : ''}`}
                        onMouseEnter={() => setActiveCard(game.id)}
                        onMouseLeave={() => setActiveCard(null)}
                    >
                        <div className="card-overlay"></div>
                        <div className="game-icon">{game.icon}</div>
                        <h2 className="game-title">{game.name}</h2>
                        <p className="game-description">{game.description}</p>
                        
                        <div className="game-features">
                            {game.features.map((feature, index) => (
                                <div key={index} className="feature-item">
                                    <span className="feature-dot">•</span>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="coming-soon-badge">
                            <span>🔮 En développement</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="games-footer">
                <div className="footer-section achievements">
                    <h2><FaMedal /> Récompenses Magiques</h2>
                    
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
                
                <div className="footer-section goals">
                    <h2><FaChartLine /> Tes Prochains Objectifs</h2>
                    
                    <div className="goals-list">
                        <div className="goal-item">
                            <div className="goal-icon"><FaBolt /></div>
                            <div className="goal-text">Compléter ta première session de Cartes Mémoire</div>
                        </div>
                        
                        <div className="goal-item">
                            <div className="goal-icon"><FaTrophy /></div>
                            <div className="goal-text">Atteindre un score de 80% ou plus</div>
                        </div>
                        
                        <div className="goal-item">
                            <div className="goal-icon"><FaStar /></div>
                            <div className="goal-text">Gagner 100 XP dans les mini-jeux</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiniGames;

/**
 * @file MiniGames.jsx
 * @description Composant React pour la page des mini-jeux.
 * Affiche une sélection de mini-jeux éducatifs, la progression de l'utilisateur et les succès.
 * Gère le chargement des données, les états d'erreur et la navigation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaGamepad, FaRocket, FaTrophy, FaStar, FaBolt, FaPlay, FaChartLine, FaRegLightbulb,
  FaArrowRight, FaCheckCircle, FaCrown
} from 'react-icons/fa';
import './MiniGames-New-UI.css';

// =================================================================================
// COMPOSANT PRINCIPAL : MiniGames
// =================================================================================

const MiniGames = () => {
    // ---------------------------------------------------------------------------------
    // ÉTATS DU COMPOSANT
    // ---------------------------------------------------------------------------------
    const [games, setGames] = useState([]); // Stocke la liste des jeux disponibles
    const [loading, setLoading] = useState(true); // Gère l'état de chargement
    const [error, setError] = useState(null); // Stocke les messages d'erreur
    const [hoveredCard, setHoveredCard] = useState(null); // Suit la carte survolée pour les effets visuels
    
    // ---------------------------------------------------------------------------------
    // HOOKS ET CONTEXTE
    // ---------------------------------------------------------------------------------
    const { token } = useAuth(); // Récupère le token d'authentification de l'utilisateur
    const navigate = useNavigate(); // Hook pour la navigation programmatique
    
    // ---------------------------------------------------------------------------------
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ---------------------------------------------------------------------------------

    /**
     * Gère la navigation vers le jeu de Flash Cards.
     * @param {React.MouseEvent} e - L'événement de clic.
     */
    const handlePlayFlashCards = (e) => {
        e.preventDefault(); // Empêche le comportement par défaut du bouton
        e.stopPropagation(); // Arrête la propagation de l'événement pour éviter les clics non désirés
        console.log('Lancement du jeu "Flash Cards"...');
        try {
            navigate('/flash-cards'); // Redirige l'utilisateur
        } catch (error) {
            console.error('Erreur de navigation:', error);
        }
    };

    // ---------------------------------------------------------------------------------
    // FONCTIONS DE RÉCUPÉRATION DE DONNÉES
    // ---------------------------------------------------------------------------------

    /**
     * Récupère la liste des jeux disponibles depuis l'API backend.
     * Utilise useCallback pour mémoriser la fonction et éviter les re-créations inutiles.
     */
    const fetchAvailableGames = useCallback(async () => {
        try {
            // Appel à l'API pour obtenir les jeux
            const response = await fetch('http://localhost:5000/api/games/available', {
                headers: {
                    'Authorization': `Bearer ${token}`, // Token JWT pour l'authentification
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setGames(data.games || []); // Met à jour l'état avec les jeux reçus
            } else {
                setError('Erreur lors du chargement des mini-jeux.');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur. Veuillez vérifier votre connexion.');
        } finally {
            setLoading(false); // Termine l'état de chargement
        }
    }, [token]); // Dépendance : la fonction est recréée si le token change
    
    // ---------------------------------------------------------------------------------
    // EFFETS DE CYCLE DE VIE
    // ---------------------------------------------------------------------------------

    /**
     * useEffect pour charger les données des jeux au montage du composant.
     */
    useEffect(() => {
        fetchAvailableGames();
    }, [fetchAvailableGames]); // Dépendance : s'exécute lorsque fetchAvailableGames est mis à jour
    
    // ---------------------------------------------------------------------------------
    // RENDU CONDITIONNEL : ÉTAT DE CHARGEMENT
    // ---------------------------------------------------------------------------------
    if (loading) {
        return (
            <div className="minigames-page">
                <div className="minigames-container">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Chargement des aventures ludiques...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------------------------------
    // RENDU CONDITIONNEL : ÉTAT D'ERREUR
    // ---------------------------------------------------------------------------------
    if (error) {
        return (
            <div className="minigames-page">
                <div className="minigames-container">
                    <div className="error-state">
                        <h2>😕 Oups! Une erreur est survenue.</h2>
                        <p>{error}</p>
                        <button onClick={fetchAvailableGames} className="minigames-play-btn">
                            <FaRocket style={{ marginRight: '8px' }} /> Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    // ---------------------------------------------------------------------------------
    // RENDU PRINCIPAL DU COMPOSANT
    // ---------------------------------------------------------------------------------
    return (
        <div className="minigames-page">
            <div className="minigames-container">
                {/* Section Héros */}
                <div className="minigames-hero">
                    <h1><FaGamepad /> L'Arène des Mini-Jeux</h1>
                    <p>Testez vos connaissances, gagnez de l'XP et devenez une légende de Kaizenverse! 🌟</p>
                </div>
                
                {/* Grille des jeux */}
                <div className="minigames-grid">
                    {/* Carte du jeu "Flash Cards" (Mis en avant) */}
                    <div 
                        className="minigames-card featured"
                        onMouseEnter={() => setHoveredCard('flash-cards')} // Effet au survol
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="featured-badge">
                            <FaBolt />
                            À la une
                        </div>
                        <div className="minigames-card-icon">🃏</div>
                        <h3>Cartes Mémoire Éclair</h3>
                        <p>Mathématiques, sciences, histoire... répondez à un maximum de questions en un temps record!</p>
                        <button 
                            onClick={handlePlayFlashCards}
                            className="minigames-play-btn"
                            aria-label="Lancer le jeu Cartes Mémoire Éclair"
                        >
                            <FaPlay />
                            <span>Jouer</span>
                        </button>
                    </div>
                    
                    {/* Affiche les jeux disponibles récupérés du backend */}
                    {games.map((game) => (
                        <div 
                            key={game.id}
                            className="minigames-card"
                            onMouseEnter={() => setHoveredCard(game.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <div className="minigames-card-icon">🎯</div>
                            <h3>{game.name}</h3>
                            <p>{game.description}</p>
                            <div className="minigames-soon">
                                <FaTrophy style={{ marginRight: '8px' }} /> Bientôt disponible
                            </div>
                        </div>
                    ))}
                    
                    {/* Cartes de jeux à venir (placeholders) */}
                    <div
                        className="minigames-card"
                        onMouseEnter={() => setHoveredCard('quiz')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="minigames-card-icon">🧩</div>
                        <h3>Quiz du Savoir</h3>
                        <p>Affrontez d'autres joueurs dans un quiz de culture générale avec classement en direct.</p>
                        <div className="minigames-soon">
                            <FaCrown style={{ marginRight: '8px' }} /> Prochainement
                        </div>
                    </div>

                    <div 
                        className="minigames-card"
                        onMouseEnter={() => setHoveredCard('math')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="minigames-card-icon">🎲</div>
                        <h3>Défi Logique</h3>
                        <p>Résolvez des énigmes et des problèmes de logique de plus en plus complexes.</p>
                        <div className="minigames-soon">
                            <FaRegLightbulb style={{ marginRight: '8px' }} /> En préparation
                        </div>
                    </div>
                    
                    <div 
                        className="minigames-card"
                        onMouseEnter={() => setHoveredCard('geo')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="minigames-card-icon">🗺️</div>
                        <h3>Géo-Explorateur</h3>
                        <p>Parcourez le monde et testez vos connaissances en géographie.</p>
                        <div className="minigames-soon">
                            <FaStar style={{ marginRight: '8px' }} /> Arrive bientôt
                        </div>
                    </div>

                    <div 
                        className="minigames-card"
                        onMouseEnter={() => setHoveredCard('memory')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="minigames-card-icon">🧠</div>
                        <h3>Palais de la Mémoire</h3>
                        <p>Exercez votre mémoire avec des séquences et des associations d'images.</p>
                        <div className="minigames-soon">
                            <FaBolt style={{ marginRight: '8px' }} /> En développement
                        </div>
                    </div>
                </div>

                {/* Section de la progression et des statistiques */}
                <div className="minigames-section">
                    <h2 className="section-title"><FaChartLine /> Votre Progression</h2>
                    <p className="section-desc">Suivez votre évolution, débloquez des récompenses et visez le sommet !</p>
                    
                    <div className="minigames-stats-summary">
                        <div className="stat-card">
                            <div className="stat-circle">
                                <span>0</span>
                            </div>
                            <p>Parties Jouées</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-circle">
                                <span>0</span>
                            </div>
                            <p>XP Totale</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-circle">
                                <span>0%</span>
                            </div>
                            <p>Score Moyen</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-circle">
                                <span>0</span>
                            </div>
                            <p>Succès Décrochés</p>
                        </div>
                    </div>

                    {/* Section des succès */}
                    <div className="minigames-achievements">
                        <h3><FaCrown /> Tableau des Succès</h3>
                        <div className="achievement-item bronze">
                            <span className="achievement-badge">🥉</span>
                            <span className="achievement-title">Premiers Pas</span>
                            <div className="achievement-progress">
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{width: '0%'}}></div>
                                </div>
                                <span className="progress-text">0/1</span>
                            </div>
                        </div>
                        <div className="achievement-item silver">
                            <span className="achievement-badge">🥈</span>
                            <span className="achievement-title">Joueur Régulier</span>
                            <div className="achievement-progress">
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{width: '0%'}}></div>
                                </div>
                                <span className="progress-text">0/10</span>
                            </div>
                        </div>
                        <div className="achievement-item gold">
                            <span className="achievement-badge">🥇</span>
                            <span className="achievement-title">Maître du Score</span>
                            <div className="achievement-progress">
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{width: '0%'}}></div>
                                </div>
                                <span className="progress-text">0/1</span>
                            </div>
                        </div>
                        <div className="achievement-item legendary">
                            <span className="achievement-badge">👑</span>
                            <span className="achievement-title">Légende des Jeux</span>
                            <div className="achievement-progress">
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{width: '0%'}}></div>
                                </div>
                                <span className="progress-text">0/100</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section des objectifs */}
                <div className="minigames-goals">
                    <h3><FaStar /> Prochains Défis</h3>
                    <div className="goals-grid">
                        <div className="goal-item">
                            <FaBolt />
                            <span>Terminer une session de Cartes Mémoire</span>
                        </div>
                        <div className="goal-item">
                            <FaTrophy />
                            <span>Atteindre un score de 80%</span>
                        </div>
                        <div className="goal-item">
                            <FaStar />
                            <span>Gagner 100 XP</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiniGames;

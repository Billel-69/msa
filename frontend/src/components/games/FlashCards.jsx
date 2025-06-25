import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRedo, FaStar, FaTrophy, FaCog, FaPlay, FaBolt, FaFire, FaCrown } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import './FlashCards.css';

const FlashCards = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    // État du jeu
    const [gameState, setGameState] = useState('configuration'); // 'configuration', 'chargement', 'en_jeu', 'termine'
    const [errorMessage, setErrorMessage] = useState(''); // Pour afficher les erreurs
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [score, setScore] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [wrongAnswers, setWrongAnswers] = useState(0);
    const [cards, setCards] = useState([]);    const [sessionId, setSessionId] = useState(null);
    // const [gameId, setGameId] = useState(null); // Kept for future use
    const [startTime, setStartTime] = useState(null);
    const [cardStartTime, setCardStartTime] = useState(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);

    // Paramètres du jeu
    const [gameSettings, setGameSettings] = useState({
        subject: 'mathematics',
        difficulty: 'moyen',
        cycle: 'cycle_4',
        theme: 'default',
        quantity: 8
    });

    // Matières disponibles et leurs libellés (clés en anglais pour la logique interne)
    const subjects = {
        mathematics: { label: 'Mathématiques', icon: '🔢' },
        french: { label: 'Français', icon: '📚' },
        history: { label: 'Histoire', icon: '🏛️' },
        sciences: { label: 'Sciences', icon: '🔬' },
        geography: { label: 'Géographie', icon: '🌍' },
        english: { label: 'Anglais', icon: '🇬🇧' }
    };

    const difficulties = {
        facile: { label: 'Facile', color: '#4CAF50' },
        moyen: { label: 'Moyen', color: '#FF9800' },
        difficile: { label: 'Difficile', color: '#F44336' }
    };
    // Gère le début du minuteur pour chaque carte
    useEffect(() => {
        if (gameState === 'en_jeu' && currentCardIndex < cards.length) {
            setCardStartTime(Date.now());
        }
    }, [currentCardIndex, gameState, cards.length]);

    // Démarre une nouvelle partie
    const startGame = async () => {
        try {
            console.log('Démarrage du jeu de Flash Cards...', { user: user?.username, hasToken: !!token });
            setGameState('chargement');
            setErrorMessage(''); // Réinitialiser les erreurs
            setStartTime(Date.now());

            const response = await axiosInstance.post('/games/flash-cards/start', gameSettings);

            console.log('Réponse du démarrage du jeu:', response.data);
            if (response.data.success) {
                setCards(response.data.cards);
                setSessionId(response.data.sessionId);
                // setGameId(response.data.gameId); // Conservé pour une utilisation future
                setGameState('en_jeu');
                setCardStartTime(Date.now());
            } else {
                throw new Error('Échec du démarrage de la partie');
            }
        } catch (error) {
            console.error('Erreur lors du démarrage du jeu:', error);
            const errorMsg = error.response?.data?.message || 'Erreur lors du démarrage du jeu. Vérifiez que vous êtes bien connecté et réessayez.';
            setErrorMessage(errorMsg);
            setGameState('configuration');
        }
    };

    // Soumet la réponse de l'utilisateur pour la carte actuelle
    const submitAnswer = async (isCorrect) => {
        try {
            const responseTime = Date.now() - cardStartTime;
            const currentCard = cards[currentCardIndex];
            // Soumission de la réponse au backend
            await axiosInstance.post('/games/flash-cards/answer', {
                sessionId: sessionId,
                cardId: currentCard.id,
                questionId: currentCard.id,
                isCorrect: isCorrect,
                responseTime: responseTime,
                difficulty: currentCard.difficulty
            });

            // Update local state with enhanced feedback
            if (isCorrect) {
                setCorrectAnswers(prev => prev + 1);
                setScore(prev => prev + getDifficultyPoints(currentCard.difficulty, responseTime));
                setStreak(prev => {
                    const newStreak = prev + 1;
                    if (newStreak > bestStreak) {
                        setBestStreak(newStreak);
                        if (newStreak >= 5) {
                            setShowCelebration(true);
                            setTimeout(() => setShowCelebration(false), 2000);
                        }
                    }
                    return newStreak;
                });
            } else {
                setWrongAnswers(prev => prev + 1);
                setStreak(0);
            }

            // Move to next card after a short delay
            setTimeout(() => {
                if (currentCardIndex < cards.length - 1) {
                    setCurrentCardIndex(prev => prev + 1);
                    setIsFlipped(false);
                } else {
                    completeGame();
                }
            }, 1500);

        } catch (error) {
            console.error('Erreur lors de la soumission de la réponse:', error);
        }
    };

    // Finalise la partie et envoie les résultats
    const completeGame = async () => {
        try {
            const totalTime = Date.now() - startTime;
            const averageResponseTime = totalTime / cards.length;            const response = await axiosInstance.post('/games/flash-cards/complete', {
                sessionId: sessionId,
                totalScore: score,
                correctAnswers: correctAnswers,
                wrongAnswers: wrongAnswers,
                totalTime: totalTime,
                averageResponseTime: averageResponseTime,
                difficulty: gameSettings.difficulty
            });

            if (response.data.success) {
                setGameState('termine');
            }
        } catch (error) {
            console.error('Erreur lors de la finalisation du jeu:', error);
            setGameState('termine'); // Affiche les résultats même en cas d'erreur
        }
    };

    // Gère la réponse de l'utilisateur (correcte ou incorrecte)
    const handleAnswer = (isCorrect) => {
        submitAnswer(isCorrect);
    };

    // Gère le retournement de la carte
    const handleCardFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleCardKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); // Empêche le comportement par défaut (ex: scroll)
            handleCardFlip();
        }
    };

    const getDifficultyPoints = (difficulty, responseTime = 5000) => {
        const basePoints = { facile: 10, moyen: 20, difficile: 30 };
        const timeBonus = Math.max(0, 10 - Math.floor(responseTime / 1000));
        return (basePoints[difficulty] || 10) + timeBonus;
    };

    const getSuccessRate = () => {
        const total = correctAnswers + wrongAnswers;
        return total > 0 ? Math.round((correctAnswers / total) * 100) : 0;
    };

    // Redémarre le jeu
    const restartGame = () => {
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setScore(0);
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setStreak(0);
        setShowCelebration(false);
        setGameState('configuration');
        setCards([]);
        setSessionId(null);
    };

    // Retourne un message de performance basé sur le taux de réussite
    const getPerformanceMessage = () => {
        const rate = getSuccessRate();
        if (rate >= 95) return "Parfait ! Tu es un vrai champion ! 🏆";
        if (rate >= 85) return "Excellent travail ! Continue comme ça ! 🌟";
        if (rate >= 75) return "Très bien ! Tu progresses ! 👏";
        if (rate >= 60) return "Pas mal ! Il y a de l'amélioration ! 💪";
        return "Continue à t'entraîner, tu vas y arriver ! 📚";
    };

    // Retourne le niveau de performance basé sur le taux de réussite
    const getPerformanceLevel = () => {
        const rate = getSuccessRate();
        if (rate >= 95) return '👑 Maître';
        if (rate >= 85) return '🌟 Expert';
        if (rate >= 75) return '⭐ Avancé';
        if (rate >= 60) return '💪 Apprenti';
        return '📚 Débutant';
    };

    // Écran de configuration du jeu
    if (gameState === 'configuration') {
        return (
            <div className="flash-cards-container">
                <div className="flash-cards-header">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Retour
                    </button>
                    <h1><FaBolt /> Flash Cards Magiques</h1>
                    <div className="header-right">
                        <div className="score-display">
                            <FaStar />
                            {score} points
                        </div>
                        {streak > 0 && (
                            <div className={`streak-display ${streak >= 3 ? 'fire' : ''}`}>
                                {streak >= 3 ? <FaFire /> : <FaBolt />}
                                {streak} en série!
                            </div>
                        )}
                        <FaCog className="settings-icon" />
                    </div>
                </div>

                <div className="game-setup">
                    <div className="setup-card">                        <h2>🎯 Prêt pour le Défi Magique?</h2>
                        <p>Configure ta session de Flash Cards et teste tes connaissances! ✨</p>

                        {errorMessage && (
                            <div className="error-message-box">
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <div className="settings-grid">
                            <div className="setting-group">
                                <label>📚 Matière</label>
                                <select 
                                    value={gameSettings.subject}
                                    onChange={(e) => setGameSettings(prev => ({...prev, subject: e.target.value}))}
                                >
                                    {Object.entries(subjects).map(([key, subj]) => (
                                        <option key={key} value={key}>
                                            {subj.icon} {subj.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="setting-group">
                                <label>🎯 Difficulté</label>
                                <select 
                                    value={gameSettings.difficulty}
                                    onChange={(e) => setGameSettings(prev => ({...prev, difficulty: e.target.value}))}
                                >
                                    {Object.entries(difficulties).map(([key, diff]) => (
                                        <option key={key} value={key}>
                                            {diff.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="setting-group">
                                <label>🎲 Nombre de cartes</label>
                                <select 
                                    value={gameSettings.quantity}
                                    onChange={(e) => setGameSettings(prev => ({...prev, quantity: parseInt(e.target.value)}))}
                                >
                                    <option value={5}>5 cartes (Rapide)</option>
                                    <option value={8}>8 cartes (Normal)</option>
                                    <option value={10}>10 cartes (Complet)</option>
                                    <option value={15}>15 cartes (Expert)</option>
                                </select>
                            </div>
                        </div>

                        <div className="difficulty-preview">
                            <div 
                                className="difficulty-indicator"
                                style={{ backgroundColor: difficulties[gameSettings.difficulty].color }}
                            >
                                {difficulties[gameSettings.difficulty].label}
                            </div>
                            <p>
                                Sujet: <strong>{subjects[gameSettings.subject].label}</strong> • 
                                Cartes: <strong>{gameSettings.quantity}</strong>
                            </p>
                        </div>                        <button 
                            className="start-game-button" 
                            onClick={startGame}
                            aria-label="Lancer la session de Flash Cards"
                        >
                            <FaPlay />
                            Lancer la Session Magique!
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Écran de chargement
    if (gameState === 'chargement') {
        return (
            <div className="flash-cards-container loading-screen">
                <div className="loading-spinner"></div>
                <h2>Préparation des cartes...</h2>
                <p>Un peu de patience, l'aventure commence bientôt !</p>
            </div>
        );
    }

    // Écran de jeu principal
    if (gameState === 'en_jeu' && cards.length > 0) {
        const currentCard = cards[currentCardIndex];
        const progressPercentage = ((currentCardIndex + 1) / cards.length) * 100;

        return (
            <div className="flash-cards-container">
                {/* Celebration overlay */}
                {showCelebration && (
                    <div className="celebration-overlay">                    <div className="celebration-content">
                            <FaCrown className="celebration-icon" />
                            <h2>Incroyable !</h2>
                            <p>Série de {bestStreak} bonnes réponses ! 🔥</p>
                            <div className="celebration-sparkles">
                                <span>✨</span>
                                <span>🌟</span>
                                <span>⭐</span>
                                <span>✨</span>
                                <span>🌟</span>
                            </div>
                        </div>
                    </div>
                )}                <div className="flash-cards-header">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Retour
                    </button>
                    <h1><FaBolt /> Flash Cards Magiques</h1>
                    <div className="header-right">
                        <div className="score-display">
                            <FaStar />
                            {score} points
                        </div>
                        {streak > 0 && (
                            <div className={`streak-display ${streak >= 3 ? 'fire' : ''}`}>
                                {streak >= 3 ? <FaFire /> : <FaBolt />}
                                Série de {streak}
                            </div>
                        )}
                        {bestStreak > 0 && (
                            <div className="best-streak-display">
                                <FaCrown />
                                Meilleur: {bestStreak}
                            </div>
                        )}
                    </div>
                </div>                <div className="game-progress">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <span className="progress-text">
                        {currentCardIndex + 1} / {cards.length}
                    </span>
                </div>
                
                {/* Game stats display right after progress and before card */}
                <div className="game-stats">
                    <div className="stat">
                        <span className="stat-label">Bonnes réponses:</span>
                        <span className="stat-value correct">{correctAnswers}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Erreurs:</span>
                        <span className="stat-value incorrect">{wrongAnswers}</span>
                    </div>
                </div>

                <div className="card-container">
                    <div 
                        className={`flash-card ${isFlipped ? 'flipped' : ''}`} 
                        onClick={handleCardFlip}
                        onKeyDown={handleCardKeyDown}
                        role="button"
                        tabIndex="0"
                        aria-label="Cliquez ou appuyez sur Entrée pour retourner la carte"
                    >
                        <div className="card-front">
                            <div className="card-category">{currentCard.category}</div>
                            <div className="card-content">
                                <h3>Question</h3>
                                <p>{currentCard.question}</p>
                            </div>
                            <div className={`difficulty-badge ${currentCard.difficulty}`}>
                                {difficulties[currentCard.difficulty]?.label || currentCard.difficulty}
                            </div>
                            <div className="flip-hint">Clique pour voir la réponse</div>
                        </div>
                        <div className="card-back">
                            <div className="card-category">{currentCard.category}</div>
                            <div className="card-content">
                                <h3>Réponse</h3>
                                <p className="answer">{currentCard.answer}</p>
                                {currentCard.explanation && (
                                    <p className="explanation">{currentCard.explanation}</p>
                                )}
                            </div>
                            <div className={`difficulty-badge ${currentCard.difficulty}`}>
                                {difficulties[currentCard.difficulty]?.label || currentCard.difficulty}
                            </div>
                        </div>
                    </div>
                </div>

                {isFlipped && (
                    <div className="answer-buttons">
                        <button 
                            className="answer-button wrong" 
                            onClick={() => handleAnswer(false)}
                            aria-label="Marquer la réponse comme fausse"
                        >
                            ❌ Faux
                        </button>
                        <button 
                            className="answer-button correct" 
                            onClick={() => handleAnswer(true)}
                            aria-label="Marquer la réponse comme correcte"
                        >
                            ✅ Correct
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Écran de fin de partie
    if (gameState === 'termine') {
        const successRate = getSuccessRate();
        return (
            <div className="flash-cards-container">                <div className="flash-cards-header">
                    <button 
                        className="back-button" 
                        onClick={() => navigate(-1)}
                        aria-label="Retourner aux mini-jeux"
                    >
                        <FaArrowLeft /> Retour
                    </button>
                    <h1>Flash Cards Magiques - Résultats</h1>
                </div>

                <div className="results-container">
                    <div className="results-card">
                        <FaTrophy className="trophy-icon" />
                        <h2>Partie terminée !</h2>                        <div className="results-stats">
                            <div className="stat-item premium">
                                <span className="stat-label">Score Final:</span>
                                <span className="stat-value gold">{score} points</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Bonnes réponses:</span>
                                <span className="stat-value correct">{correctAnswers}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Mauvaises réponses:</span>
                                <span className="stat-value incorrect">{wrongAnswers}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Taux de réussite:</span>
                                <span className="stat-value">{getSuccessRate()}%</span>
                            </div>
                            <div className="stat-item premium">
                                <span className="stat-label">Meilleure série:</span>
                                <span className="stat-value streak">{bestStreak} 🔥</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Niveau atteint:</span>
                                <span className="stat-value level">
                                    {getPerformanceLevel()}
                                </span>
                            </div>
                        </div>

                        <p className="performance-message">
                            {getPerformanceMessage()}
                        </p>

                        <div className="results-actions">
                            <button className="action-button restart" onClick={restartGame}>
                                <FaRedo /> Rejouer
                            </button>
                            <button className="action-button back-home" onClick={() => navigate('/mini-jeux')}>
                                <FaTrophy /> Voir d'autres jeux
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback pour état de jeu inconnu
    return (
        <div className="flash-cards-container">
            <p>État de jeu inconnu. Veuillez rafraîchir la page.</p>
            <button onClick={restartGame}>Réinitialiser</button>
        </div>
    );
};

export default FlashCards;

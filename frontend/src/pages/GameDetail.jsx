import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
    FaArrowLeft, FaStar, FaCheck, FaTimes, 
    FaRedo
} from 'react-icons/fa';
import '../styles/GameDetail.css';

const GameDetail = () => {
    const { id: gameId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuth();
    
    // Debug log
    console.log('GameDetail - gameId from params:', gameId);
    
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [gameStartTime] = useState(new Date());
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    
    // Fetch game details
    useEffect(() => {
        const fetchGameDetails = async () => {
            try {
                setLoading(true);
                console.log('Fetching game with ID:', gameId);
                
                // Récupérer les paramètres de l'URL
                const urlParams = new URLSearchParams(location.search);
                const subject = urlParams.get('subject') || '';
                const niveau = urlParams.get('niveau') || '';
                
                const response = await axios.get(
                    `http://localhost:5000/api/games/${gameId}`,
                    {
                        params: { subject, niveau },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                
                console.log('Game fetched successfully:', response.data.game);
                const gameData = response.data.game;
                setGame(gameData);
                
                // Initialiser le timer : 8 secondes par question
                if (gameData.questions && gameData.questions.length > 0) {
                    const calculatedTime = gameData.questions.length * 8;
                    setTimeLeft(calculatedTime);
                    setTotalTime(calculatedTime);
                    setTimerActive(true);
                }
                
                setLoading(false);
            } catch (err) {
                console.error('Error fetching game:', err);
                console.error('Request URL was:', `http://localhost:5000/api/games/${gameId}`);
                setError('Impossible de charger ce jeu. Veuillez réessayer.');
                setLoading(false);
            }
        };
        
        fetchGameDetails();
    }, [gameId, location.search, token]);
    
    // Gestion du timer
    useEffect(() => {
        if (!timerActive || timeLeft <= 0) return;
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setTimerActive(false);
                    // Temps écoulé - terminer le jeu automatiquement
                    submitGameResults(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(timer);
    }, [timerActive, timeLeft]);
    
    // Handle answer selection for quiz type games
    const handleAnswer = (optionIndex) => {
        if (showFeedback || !game || !game.questions) return;
        
        const correctAnswerIndex = game.questions[currentQuestion].options.indexOf(
            game.questions[currentQuestion].correctAnswer
        );
        
        const correct = optionIndex === correctAnswerIndex;
        
        setSelectedOption(optionIndex);
        setIsCorrect(correct);
        setShowFeedback(true);
        
        if (correct) {
            setScore(score + 1);
            setXp(xp + 5);
            setStreak(streak + 1);
            setCorrectAnswers(correctAnswers + 1);
        } else {
            setStreak(0);
        }
        
        // Move to next question or end game after delay
        setTimeout(() => {
            setShowFeedback(false);
            setSelectedOption(null);
            
            if (currentQuestion < game.questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                // Fin du jeu - arrêter le timer
                setTimerActive(false);
                submitGameResults(correct);
            }
        }, 2000);
    };
    
    // Submit game results to backend
    const submitGameResults = async (lastQuestionCorrect) => {
        try {
            const gameEndTime = new Date();
            const timeSpent = Math.floor((gameEndTime - gameStartTime) / 1000); // in seconds
            
            const finalScore = Math.round(((score + (lastQuestionCorrect ? 1 : 0)) / game.questions.length) * 100);
            
            const totalCorrect = correctAnswers + (lastQuestionCorrect ? 1 : 0);
            
            const response = await axios.post(
                `http://localhost:5000/api/games/${gameId}/results`,
                {
                    score: finalScore,
                    timeSpent: timeSpent,
                    correctAnswers: totalCorrect
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            setScore(finalScore);
            setGameCompleted(true);
        } catch (err) {
            console.error('Error saving game results:', err);
            setError('Impossible d\'enregistrer vos résultats.');
        }
    };
    
    // Reset game to play again
    const handlePlayAgain = () => {
        setCurrentQuestion(0);
        setScore(0);
        setSelectedOption(null);
        setShowFeedback(false);
        setGameCompleted(false);
        setXp(0);
        setStreak(0);
        setCorrectAnswers(0);
        // Relancer le timer
        setTimeLeft(totalTime);
        setTimerActive(true);
    };
    
    // Render loading state
    if (loading) {
        return (
            <div className="game-detail-page">
                <div className="game-detail-container">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Chargement du jeu...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Render error state
    if (error) {
        return (
            <div className="game-detail-page">
                <div className="game-detail-container">
                    <div className="error-state">
                        <h2>Une erreur est survenue</h2>
                        <p>{error}</p>
                        <button onClick={() => navigate('/mini-jeux')} className="btn-back">
                            <FaArrowLeft /> Retour aux mini-jeux
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    // Render game not found state
    if (!game) {
        return (
            <div className="game-detail-page">
                <div className="game-detail-container">
                    <div className="error-state">
                        <h2>Jeu non trouvé</h2>
                        <p>Ce jeu n'existe pas ou n'est plus disponible.</p>
                        <button onClick={() => navigate('/mini-jeux')} className="btn-back">
                            <FaArrowLeft /> Retour aux mini-jeux
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    // Render completed game state
    if (gameCompleted) {
        return (
            <div className="game-detail-page">
                <div className="game-detail-container">
                    <button className="btn-back" onClick={() => navigate('/mini-jeux')}>
                        <FaArrowLeft /> Retour aux jeux
                    </button>
                    
                    <div className="game-completed">
                        <div className="result-animation">
                            {score >= 70 ? (
                                <div className="success-animation">
                                    <FaCheck />
                                </div>
                            ) : (
                                <div className="almost-animation">
                                    <FaTimes />
                                </div>
                            )}
                        </div>
                        
                        <h2>Jeu Terminé !</h2>
                        
                        <div className="result-stats">
                            <div className="result-stat">
                                <div className="stat-icon score">
                                    {score >= 70 ? <FaCheck /> : <FaTimes />}
                                </div>
                                <div className="stat-label">Score</div>
                                <div className="stat-value">{score}%</div>
                            </div>
                            
                            <div className="result-stat">
                                <div className="stat-icon xp">
                                    <FaStar />
                                </div>
                                <div className="stat-label">XP Gagnée</div>
                                <div className="stat-value">+{xp}</div>
                            </div>
                        </div>
                        
                        <div className="result-message">
                            {score >= 70 ? (
                                <p className="success-message">
                                    Félicitations ! Tu as réussi ce jeu en {Math.floor((totalTime - timeLeft) / 60)}:{((totalTime - timeLeft) % 60).toString().padStart(2, '0')} !
                                </p>
                            ) : (
                                <p className="try-again-message">
                                    Presque ! Essaie encore pour gagner plus de points !
                                    {timeLeft > 0 && <span> Temps utilisé: {Math.floor((totalTime - timeLeft) / 60)}:{((totalTime - timeLeft) % 60).toString().padStart(2, '0')}</span>}
                                </p>
                            )}
                        </div>
                        
                        <div className="result-buttons">
                            <button className="btn-play-again" onClick={handlePlayAgain}>
                                <FaRedo /> Rejouer
                            </button>
                            <button className="btn-back-to-games" onClick={() => navigate('/mini-jeux')}>
                                Autres jeux
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // Render quiz game (default game type)
    return (
        <div className="game-detail-page">
            <div className="game-detail-container">
                <button className="btn-back" onClick={() => navigate('/mini-jeux')}>
                    <FaArrowLeft /> Retour aux jeux
                </button>
                
                <div className="game-header">
                    <h1>{game.name}</h1>
                    <div className="game-subject">{game.subject}</div>
                </div>
                
                <div className="game-content">
                    {/* Quiz Game UI */}
                    {game.questions && game.questions.length > 0 && (
                        <div className="quiz-game">
                            <div className="quiz-progress">
                                <div className="question-count">
                                    Question {currentQuestion + 1} sur {game.questions.length}
                                </div>
                                <div className="score-display">
                                    Score: {score}
                                </div>
                                <div className="xp-display">
                                    XP: {xp}
                                </div>
                                <div className="streak-display">
                                    Streak: {streak}
                                </div>
                                <div className={`timer-display ${timeLeft <= 10 ? 'timer-urgent' : ''}`}>
                                    ⏰ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                            
                            <div className="quiz-question">
                                <h2>{game.questions[currentQuestion].question}</h2>
                            </div>
                            
                            <div className="quiz-options">
                                {game.questions[currentQuestion].options.map((option, index) => (
                                    <button
                                        key={index}
                                        className={`quiz-option ${
                                            selectedOption === index ? 'selected' : ''
                                        } ${
                                            showFeedback && selectedOption === index
                                                ? isCorrect ? 'correct' : 'incorrect'
                                                : ''
                                        }`}
                                        onClick={() => handleAnswer(index)}
                                        disabled={showFeedback}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            
                            {showFeedback && game.questions[currentQuestion].explanation && (
                                <div className={`explanation ${isCorrect ? 'correct' : 'incorrect'}`}>
                                    <p>{game.questions[currentQuestion].explanation}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameDetail;

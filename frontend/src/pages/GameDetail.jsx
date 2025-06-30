import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    const { token } = useAuth();
    
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
    
    // Fetch game details
    useEffect(() => {
        const fetchGameDetails = async () => {
            try {
                setLoading(true);
                
                const response = await axios.get(`http://localhost:5000/api/games/${gameId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setGame(response.data.game);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching game:', err);
                setError('Impossible de charger ce jeu. Veuillez réessayer.');
                setLoading(false);
            }
        };
        
        fetchGameDetails();
    }, [gameId, token]);
    
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
                // End the game
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
            
            const response = await axios.post(
                `http://localhost:5000/api/games/${gameId}/results`,
                {
                    score: finalScore,
                    timeSpent: timeSpent
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
                                <div className="stat-value">+{Math.round(score * game.xpReward / 100)}</div>
                            </div>
                        </div>
                        
                        <div className="result-message">
                            {score >= 70 ? (
                                <p className="success-message">
                                    Félicitations ! Tu as réussi ce jeu !
                                </p>
                            ) : (
                                <p className="try-again-message">
                                    Presque ! Essaie encore pour gagner plus de points !
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

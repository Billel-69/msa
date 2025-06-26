import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QuizGame.css';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaGamepad, FaClock, FaArrowRight, FaRedo } from 'react-icons/fa';

const QuizGame = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [gameState, setGameState] = useState('start'); // start, playing, results
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(90); // 90 seconds per quiz
    const [showExplanation, setShowExplanation] = useState(false);
    
    const { token } = useAuth();

    useEffect(() => {
        const fetchQuizzes = async () => {
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:5000/api/quizzes', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setQuizzes(res.data);
                if (res.data.length > 0) {
                    setCurrentQuiz(res.data[0]);
                }
            } catch (err) {
                console.error('Error fetching questions:', err);
            }
        };
        fetchQuizzes();
    }, [token]);

    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(timer);
                        endGame();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const startGame = () => {
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        setTimeLeft(90);
        setShowScore(false);
        setSelectedAnswer(null);
        setAnswered(false);
        setShowExplanation(false);
    };

    const handleAnswerOptionClick = (selectedIndex) => {
        if (answered) return;
        
        setSelectedAnswer(selectedIndex);
        setAnswered(true);
        
        // Check if answer is correct and update score
        if (selectedIndex === currentQuiz.questions[currentQuestionIndex].correctOption) {
            setScore(score + 1);
        }
        
        // Show explanation
        setShowExplanation(true);
    };

    const nextQuestion = () => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < currentQuiz.questions.length) {
            setCurrentQuestionIndex(nextIndex);
            setSelectedAnswer(null);
            setAnswered(false);
            setShowExplanation(false);
        } else {
            endGame();
        }
    };

    const endGame = () => {
        setGameState('results');
        setShowScore(true);
    };

    const restartGame = () => {
        setGameState('start');
    };

    if (!currentQuiz) {
        return (
            <div className="quiz-game-container">
                <div className="loading-state">
                    <div className="loading-icon">
                        <FaGamepad />
                    </div>
                    <h2>Chargement du Quiz...</h2>
                    <p>Préparation des questions...</p>
                </div>
            </div>
        );
    }

    // Score percentage for results page
    const scorePercentage = (score / currentQuiz.questions.length) * 100;
    
    // Progress percentage for progress bar
    const progressPercentage = ((currentQuestionIndex) / currentQuiz.questions.length) * 100;

    return (
        <div className="quiz-game-container">
            {/* Header */}
            <div className="quiz-header">
                <h1 className="quiz-title">Duel de Connaissances</h1>
                <p className="quiz-subtitle">Teste tes connaissances et gagne des récompenses !</p>
            </div>

            {gameState === 'start' && (
                <div className="quiz-start-screen">
                    <div className="start-icon">
                        <FaGamepad className="icon-pulse" />
                    </div>
                    <h2>Prêt pour le défi ?</h2>
                    <p className="game-description">
                        Teste tes connaissances avec ce quiz interactif !<br />
                        <strong>{currentQuiz.questions.length} questions • 90 secondes • Bonne chance !</strong>
                    </p>
                    <button className="start-button" onClick={startGame}>
                        Commencer l'aventure ! <FaArrowRight />
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <>
                    {/* Game Info Bar */}
                    <div className="quiz-game-info">
                        <div className="question-number">
                            Question <span>{currentQuestionIndex + 1}</span>/{currentQuiz.questions.length}
                        </div>
                        <div className="quiz-progress-bar">
                            <div 
                                className="quiz-progress-fill" 
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        <div className={`quiz-timer ${timeLeft <= 10 ? 'timer-warning' : ''}`}>
                            <FaClock /> {timeLeft}s
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="quiz-question-card">
                        <div className="quiz-objective-tag">
                            {currentQuiz.questions[currentQuestionIndex].subject || "Question"}
                        </div>
                        <div className="quiz-question-text">
                            {currentQuiz.questions[currentQuestionIndex].questionText}
                        </div>
                        <div className="quiz-options-grid">
                            {currentQuiz.questions[currentQuestionIndex].options.map((option, index) => (
                                <button 
                                    key={index} 
                                    className={`quiz-option-button 
                                        ${selectedAnswer === index ? 'selected' : ''}
                                        ${answered && index === currentQuiz.questions[currentQuestionIndex].correctOption ? 'correct' : ''}
                                        ${answered && selectedAnswer === index && index !== currentQuiz.questions[currentQuestionIndex].correctOption ? 'incorrect' : ''}
                                    `}
                                    onClick={() => handleAnswerOptionClick(index)}
                                >
                                    <div className="quiz-option-content">
                                        <div className="quiz-option-label">{String.fromCharCode(65 + index)}</div>
                                        <span>{option}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {showExplanation && (
                            <div className="quiz-explanation">
                                {currentQuiz.questions[currentQuestionIndex].explanation || "La réponse est correcte !"}
                            </div>
                        )}

                        {answered && (
                            <button 
                                className="quiz-next-button" 
                                onClick={nextQuestion}
                            >
                                {currentQuestionIndex < currentQuiz.questions.length - 1 
                                    ? 'Question suivante' 
                                    : 'Voir les résultats'}
                                <FaArrowRight />
                            </button>
                        )}
                    </div>
                </>
            )}

            {gameState === 'results' && (
                <div className="quiz-results-screen">
                    <div className="results-trophy">
                        <FaTrophy />
                    </div>
                    <div className="quiz-final-score">
                        {score}/{currentQuiz.questions.length}
                    </div>
                    <div className="quiz-score-message">
                        {scorePercentage >= 90 ? 'Extraordinaire ! Tu maîtrises parfaitement le sujet !' :
                         scorePercentage >= 75 ? 'Excellent travail ! Continue comme ça !' :
                         scorePercentage >= 50 ? 'Bon travail ! Il y a encore de la place pour progresser.' :
                         'Continue à t\'entraîner, tu t\'amélioreras !'}
                    </div>
                    <button className="quiz-restart-button" onClick={restartGame}>
                        <FaRedo /> Refaire le quiz
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuizGame;

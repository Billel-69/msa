import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import './QuizGame.css';
import { useAuth } from '../../context/AuthContext';

const QuizGame = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const { token } = useAuth(); // Get token from auth context

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await axiosInstance.get('/quizzes');
                console.log("Quizzes loaded:", response.data);
                setQuizzes(response.data);
                if (response.data.length > 0) {
                    setCurrentQuiz(response.data[0]); // Start with the first quiz
                }
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            }
        };
        
        if (token) {
            fetchQuizzes();
        }
    }, [token]);

    const handleAnswerOptionClick = (selectedIndex) => {
        if (currentQuiz && currentQuiz.questions && 
            selectedIndex === currentQuiz.questions[currentQuestionIndex].correctOption) {
            setScore(score + 1);
        }

        const nextQuestion = currentQuestionIndex + 1;
        if (currentQuiz && currentQuiz.questions && nextQuestion < currentQuiz.questions.length) {
            setCurrentQuestionIndex(nextQuestion);
        } else {
            setShowScore(true);
        }
    };

    if (!currentQuiz) {
        return <div className="quiz-container">Loading...</div>;
    }

    return (
        <div className="quiz-container">
            <h2 className="quiz-title">{currentQuiz.title}</h2>
            <div className="quiz-subject">Subject: {currentQuiz.subject}</div>
            
            {showScore ? (
                <div className="score-section">
                    <h3>Quiz Completed!</h3>
                    <p>You scored {score} out of {currentQuiz.questions.length}</p>
                    <button className="restart-button" onClick={() => {
                        setCurrentQuestionIndex(0);
                        setScore(0);
                        setShowScore(false);
                    }}>
                        Try Again
                    </button>
                </div>
            ) : (
                <>
                    <div className="question-section">
                        <div className="question-count">
                            <span>Question {currentQuestionIndex + 1}</span>/{currentQuiz.questions.length}
                        </div>
                        <div className="question-text">{currentQuiz.questions[currentQuestionIndex].questionText}</div>
                    </div>
                    <div className="answer-section">
                        {currentQuiz.questions[currentQuestionIndex].options.map((option, index) => (
                            <button key={index} onClick={() => handleAnswerOptionClick(index)}>
                                {option}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default QuizGame;

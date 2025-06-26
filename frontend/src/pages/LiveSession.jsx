import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';
import {
    FaArrowLeft,
    FaPaperPlane,
    FaUsers,
    FaVideo,
    FaCrown,
    FaUserGraduate,
    FaChild,
    FaSignOutAlt,
    FaCog
} from 'react-icons/fa';
import './LiveSession.css';

function LiveSession() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { isConnected, joinSession, leaveSession, sendMessage, onNewMessage, onJoinedSession, onError } = useSocket();

    // États
    const [session, setSession] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);

    // Refs
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);

    useEffect(() => {
        if (!token || !user) {
            navigate('/connexion');
            return;
        }

        fetchSessionDetails();
    }, [sessionId, token, user, navigate]);

    useEffect(() => {
        if (isConnected && session && !connected) {
            handleJoinSession();
        }
    }, [isConnected, session, connected]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Écouteurs Socket.io
    useEffect(() => {
        const unsubscribeNewMessage = onNewMessage((message) => {
            console.log('Nouveau message reçu:', message);
            setMessages(prev => [...prev, message]);
        });

        const unsubscribeJoined = onJoinedSession((data) => {
            console.log('Session rejointe:', data);
            setConnected(true);
            setError(null);
        });

        const unsubscribeError = onError((error) => {
            console.error('Erreur Socket:', error);
            setError(error.message);
        });

        return () => {
            if (unsubscribeNewMessage) unsubscribeNewMessage();
            if (unsubscribeJoined) unsubscribeJoined();
            if (unsubscribeError) unsubscribeError();
        };
    }, [onNewMessage, onJoinedSession, onError]);

    const fetchSessionDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/live/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSession(response.data.session);
            setParticipants(response.data.participants || []);

            // Charger les messages existants
            await loadMessages();

        } catch (error) {
            console.error('Erreur:', error);
            setError('Impossible de charger la session');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/live/session/${sessionId}/chat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data);
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        }
    };

    const handleJoinSession = () => {
        if (session && isConnected) {
            joinSession(sessionId);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !connected) return;

        sendMessage(sessionId, newMessage.trim());
        setNewMessage('');

        // Focus sur l'input
        setTimeout(() => {
            messageInputRef.current?.focus();
        }, 100);
    };

    const handleLeaveSession = () => {
        if (window.confirm('Êtes-vous sûr de vouloir quitter cette session ?')) {
            leaveSession(sessionId);
            navigate('/live');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUserIcon = (accountType) => {
        switch (accountType) {
            case 'teacher': return <FaUserGraduate className="user-icon teacher" />;
            case 'parent': return <FaCrown className="user-icon parent" />;
            case 'child': return <FaChild className="user-icon child" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="live-session-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement de la session...</p>
                </div>
            </div>
        );
    }

    if (error && !session) {
        return (
            <div className="live-session-container">
                <div className="error-message">
                    <h2>Erreur</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/live')} className="back-btn">
                        Retour au menu Live
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="live-session-container">
            {/* Header de la session */}
            <div className="session-header">
                <div className="header-left">
                    <button onClick={() => navigate('/live')} className="back-button">
                        <FaArrowLeft />
                    </button>
                    <div className="session-info">
                        <div className="session-status">
                            <div className={`status-indicator ${session?.status}`}></div>
                            <span className="status-text">
                                {session?.status === 'live' ? 'EN DIRECT' : 'EN ATTENTE'}
                            </span>
                        </div>
                        <h1>{session?.title}</h1>
                        <p className="session-details">
                            <span>Par {session?.teacher_name}</span>
                            <span>•</span>
                            <span>{session?.subject}</span>
                            <span>•</span>
                            <span>Code: {session?.room_code}</span>
                        </p>
                    </div>
                </div>

                <div className="header-right">
                    <div className="connection-status">
                        <div className={`connection-indicator ${isConnected && connected ? 'connected' : 'disconnected'}`}></div>
                        <span>{isConnected && connected ? 'Connecté' : 'Déconnecté'}</span>
                    </div>
                    <button onClick={handleLeaveSession} className="leave-button">
                        <FaSignOutAlt />
                        Quitter
                    </button>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="session-content">
                {/* Zone vidéo/présentation */}
                <div className="video-section">
                    <div className="video-placeholder">
                        <FaVideo className="video-icon" />
                        <h3>Zone de présentation</h3>
                        <p>La diffusion vidéo sera disponible prochainement</p>

                        {session?.status !== 'live' && (
                            <div className="waiting-message">
                                <p>⏳ En attente du début de la session...</p>
                            </div>
                        )}
                    </div>

                    {/* Participants */}
                    <div className="participants-panel">
                        <div className="participants-header">
                            <FaUsers />
                            <span>Participants ({participants.length})</span>
                        </div>
                        <div className="participants-list">
                            {participants.map(participant => (
                                <div key={participant.user_id} className={`participant ${participant.role}`}>
                                    <div className="participant-avatar">
                                        {participant.profile_picture ? (
                                            <img src={`http://localhost:5000/uploads/${participant.profile_picture}`} alt={participant.user_name} />
                                        ) : (
                                            <span>{participant.user_name?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="participant-info">
                                        <span className="participant-name">{participant.user_name}</span>
                                        <div className="participant-role">
                                            {getUserIcon(participant.role)}
                                            {participant.role === 'teacher' ? 'Professeur' :
                                                participant.role === 'parent' ? 'Parent' : 'Élève'}
                                        </div>
                                    </div>
                                    {participant.role === 'teacher' && (
                                        <FaCrown className="teacher-crown" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat */}
                <div className="chat-section">
                    <div className="chat-header">
                        <h3>💬 Chat de la session</h3>
                        {error && (
                            <div className="chat-error">⚠️ {error}</div>
                        )}
                    </div>

                    <div className="chat-messages">
                        {messages.map(message => (
                            <div key={message.id} className={`message ${message.message_type} ${message.user_id === user.id ? 'own' : 'other'}`}>
                                {message.message_type === 'system' ? (
                                    <div className="system-message">
                                        <span>{message.message}</span>
                                        <time>{formatTime(message.created_at)}</time>
                                    </div>
                                ) : (
                                    <>
                                        {message.user_id !== user.id && (
                                            <div className="message-avatar">
                                                {message.profile_picture ? (
                                                    <img src={`http://localhost:5000/uploads/${message.profile_picture}`} alt={message.user_name} />
                                                ) : (
                                                    <span>{message.user_name?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="message-content">
                                            {message.user_id !== user.id && (
                                                <div className="message-header">
                                                    <span className="message-author">{message.user_name}</span>
                                                    {getUserIcon(message.account_type)}
                                                    <time className="message-time">{formatTime(message.created_at)}</time>
                                                </div>
                                            )}
                                            <div className="message-bubble">
                                                <p>{message.message}</p>
                                                {message.user_id === user.id && (
                                                    <time className="message-time">{formatTime(message.created_at)}</time>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="chat-input-form">
                        <div className="chat-input-container">
                            <input
                                ref={messageInputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={connected ? "Tapez votre message..." : "Connexion au chat..."}
                                className="chat-input"
                                maxLength={500}
                                disabled={!connected}
                            />
                            <button
                                type="submit"
                                className="send-button"
                                disabled={!newMessage.trim() || !connected}
                            >
                                <FaPaperPlane />
                            </button>
                        </div>
                        <div className="chat-status">
                            {!isConnected && <span className="status-offline">❌ Déconnecté</span>}
                            {isConnected && !connected && <span className="status-connecting">🔄 Connexion...</span>}
                            {isConnected && connected && <span className="status-online">✅ En ligne</span>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LiveSession;
// Copier le contenu du composant Messages.jsx précédemment créé
// Ce fichier va dans src/pages/Messages.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    FaArrowLeft,
    FaPaperPlane,
    FaSearch,
    FaUserPlus,
    FaEllipsisV,
    FaTrash,
    FaCircle
} from 'react-icons/fa';
import './Messages.css';

function Messages() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();

    // États principaux
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // États pour la recherche et création de conversations
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);

    useEffect(() => {
        if (!token || !user) {
            navigate('/connexion');
            return;
        }

        fetchConversations();

        if (conversationId) {
            fetchConversationDetails();
            fetchMessages();
        }
    }, [conversationId, token, user, navigate]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-refresh messages toutes les 3 secondes si dans une conversation
    useEffect(() => {
        if (!conversationId) return;

        const interval = setInterval(() => {
            fetchMessages(true); // true = silent refresh
        }, 3000);

        return () => clearInterval(interval);
    }, [conversationId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/messages/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversationDetails = async () => {
        try {
            if (!conversationId) return;

            const response = await axios.get(
                `http://localhost:5000/api/messages/conversation/${conversationId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setCurrentConversation(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des détails:', error);
        }
    };

    const fetchMessages = async (silent = false) => {
        if (!conversationId) return;

        try {
            const response = await axios.get(
                `http://localhost:5000/api/messages/conversation/${conversationId}/messages`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setMessages(response.data);

            // Marquer comme lu
            await axios.put(
                `http://localhost:5000/api/messages/conversation/${conversationId}/read`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (!silent) {
                fetchConversations(); // Refresh conversation list to update unread counts
            }
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const response = await axios.post(
                `http://localhost:5000/api/messages/conversation/${conversationId}/send`,
                { content: newMessage.trim() },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            fetchConversations(); // Update conversation list

            // Focus back to input
            setTimeout(() => {
                messageInputRef.current?.focus();
            }, 100);

        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            alert('Erreur lors de l\'envoi du message');
        } finally {
            setSending(false);
        }
    };

    const searchUsers = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/messages/search-users?q=${encodeURIComponent(query)}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setSearchResults(response.data);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const startConversation = async (otherUserId) => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/messages/conversation/with/${otherUserId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setShowSearch(false);
            setSearchQuery('');
            setSearchResults([]);
            navigate(`/messages/${response.data.conversationId}`);
            fetchConversations();
        } catch (error) {
            console.error('Erreur lors de la création de conversation:', error);
            alert('Erreur lors de la création de la conversation');
        }
    };

    const deleteMessage = async (messageId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/messages/message/${messageId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du message');
        }
    };

    const formatMessageTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.abs(now - date) / 36e5;

        if (diffInHours < 24) {
            return date.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit'
            });
        }
    };

    const handleSearchInput = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchUsers(query);
    };

    if (loading) {
        return (
            <div className="messages-page loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement des messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="messages-page">
            {/* Sidebar avec liste des conversations */}
            <div className="conversations-sidebar">
                <div className="sidebar-header">
                    <h2>Messages</h2>
                    <button
                        className="new-message-btn"
                        onClick={() => setShowSearch(!showSearch)}
                        title="Nouvelle conversation"
                    >
                        <FaUserPlus />
                    </button>
                </div>

                {/* Zone de recherche pour nouvelle conversation */}
                {showSearch && (
                    <div className="search-section">
                        <div className="search-input-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher un utilisateur..."
                                value={searchQuery}
                                onChange={handleSearchInput}
                                className="search-input"
                            />
                        </div>

                        {searchLoading && (
                            <div className="search-loading">
                                <div className="spinner-small"></div>
                                <span>Recherche...</span>
                            </div>
                        )}

                        {searchResults.length > 0 && (
                            <div className="search-results">
                                {searchResults.map(user => (
                                    <div
                                        key={user.id}
                                        className="search-result-item"
                                        onClick={() => startConversation(user.id)}
                                    >
                                        <div className="user-avatar">
                                            {user.profile_picture ? (
                                                <img
                                                    src={`http://localhost:5000/uploads/${user.profile_picture}`}
                                                    alt={user.name}
                                                />
                                            ) : (
                                                <span>{user.name?.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <h4>{user.name}</h4>
                                            <p>@{user.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                            <div className="no-search-results">
                                <p>Aucun utilisateur trouvé</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Liste des conversations */}
                <div className="conversations-list">
                    {conversations.length === 0 ? (
                        <div className="no-conversations">
                            <p>Aucune conversation</p>
                            <span>Recherchez un utilisateur pour commencer à discuter</span>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.conversation_id}
                                className={`conversation-item ${conversationId === conv.conversation_id.toString() ? 'active' : ''}`}
                                onClick={() => navigate(`/messages/${conv.conversation_id}`)}
                            >
                                <div className="conversation-avatar">
                                    {conv.other_user_picture ? (
                                        <img
                                            src={`http://localhost:5000/uploads/${conv.other_user_picture}`}
                                            alt={conv.other_user_name}
                                        />
                                    ) : (
                                        <span>{conv.other_user_name?.charAt(0).toUpperCase()}</span>
                                    )}
                                    {conv.unread_count > 0 && (
                                        <div className="unread-indicator">
                                            <FaCircle />
                                        </div>
                                    )}
                                </div>

                                <div className="conversation-content">
                                    <div className="conversation-header">
                                        <h4>{conv.other_user_name}</h4>
                                        <span className="time">
                                            {formatMessageTime(conv.last_message_time)}
                                        </span>
                                    </div>
                                    <div className="conversation-preview">
                                        <p className={conv.unread_count > 0 ? 'unread' : ''}>
                                            {conv.last_message || 'Aucun message'}
                                        </p>
                                        {conv.unread_count > 0 && (
                                            <span className="unread-count">{conv.unread_count}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Zone principale des messages */}
            <div className="messages-main">
                {!conversationId ? (
                    <div className="no-conversation-selected">
                        <div className="welcome-message">
                            <h3>Sélectionnez une conversation</h3>
                            <p>Choisissez une conversation dans la liste ou créez-en une nouvelle</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header de la conversation */}
                        <div className="conversation-header">
                            <button
                                className="back-btn"
                                onClick={() => navigate('/messages')}
                            >
                                <FaArrowLeft />
                            </button>

                            {currentConversation && (
                                <div className="conversation-info">
                                    <div className="user-avatar">
                                        {currentConversation.other_user_picture ? (
                                            <img
                                                src={`http://localhost:5000/uploads/${currentConversation.other_user_picture}`}
                                                alt={currentConversation.other_user_name}
                                            />
                                        ) : (
                                            <span>{currentConversation.other_user_name?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="user-details">
                                        <h3>{currentConversation.other_user_name}</h3>
                                        <p>@{currentConversation.other_user_username}</p>
                                    </div>
                                </div>
                            )}

                            <button className="options-btn">
                                <FaEllipsisV />
                            </button>
                        </div>

                        {/* Zone des messages */}
                        <div className="messages-container">
                            {messages.length === 0 ? (
                                <div className="no-messages">
                                    <p>Aucun message dans cette conversation</p>
                                    <span>Envoyez votre premier message !</span>
                                </div>
                            ) : (
                                messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={`message ${message.sender_id === user.id ? 'own' : 'other'}`}
                                    >
                                        {message.sender_id !== user.id && (
                                            <div className="message-avatar">
                                                {message.sender_picture ? (
                                                    <img
                                                        src={`http://localhost:5000/uploads/${message.sender_picture}`}
                                                        alt={message.sender_name}
                                                    />
                                                ) : (
                                                    <span>{message.sender_name?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                        )}

                                        <div className="message-content">
                                            <div className="message-bubble">
                                                <p>{message.content}</p>
                                                {message.sender_id === user.id && (
                                                    <button
                                                        className="delete-message-btn"
                                                        onClick={() => deleteMessage(message.id)}
                                                        title="Supprimer le message"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                            <span className="message-time">
                                                {formatMessageTime(message.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Zone d'envoi de message */}
                        <form className="message-input-container" onSubmit={sendMessage}>
                            <input
                                ref={messageInputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Tapez votre message..."
                                className="message-input"
                                maxLength={1000}
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                className="send-btn"
                                disabled={!newMessage.trim() || sending}
                            >
                                {sending ? (
                                    <div className="spinner-small"></div>
                                ) : (
                                    <FaPaperPlane />
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default Messages;
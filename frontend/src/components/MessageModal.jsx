import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaTimes, FaSearch, FaPaperPlane } from 'react-icons/fa';
import './MessageModal.css';

function MessageModal({ isOpen, onClose, recipientUser = null }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(recipientUser);
    const [message, setMessage] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const { token } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (recipientUser) {
            setSelectedUser(recipientUser);
        }
    }, [recipientUser]);

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

    const handleSearchInput = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchUsers(query);
    };

    const selectUser = (user) => {
        setSelectedUser(user);
        setSearchQuery('');
        setSearchResults([]);
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!selectedUser || !message.trim()) return;

        setSending(true);
        try {
            // Créer ou obtenir la conversation
            const convResponse = await axios.get(
                `http://localhost:5000/api/messages/conversation/with/${selectedUser.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const conversationId = convResponse.data.conversationId;

            // Envoyer le message
            await axios.post(
                `http://localhost:5000/api/messages/conversation/${conversationId}/send`,
                { content: message.trim() },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Fermer la modal et rediriger vers la conversation
            onClose();
            navigate(`/messages/${conversationId}`);

        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            alert('Erreur lors de l\'envoi du message');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(recipientUser);
        setMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="message-modal-overlay" onClick={handleClose}>
            <div className="message-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Nouveau message</h3>
                    <button className="close-btn" onClick={handleClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="modal-content">
                    {/* Sélection du destinataire */}
                    {!selectedUser ? (
                        <div className="recipient-selection">
                            <label>À :</label>
                            <div className="search-input-container">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un utilisateur..."
                                    value={searchQuery}
                                    onChange={handleSearchInput}
                                    className="search-input"
                                    autoFocus
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
                                            onClick={() => selectUser(user)}
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
                    ) : (
                        <div className="selected-recipient">
                            <label>À :</label>
                            <div className="recipient-info">
                                <div className="user-avatar">
                                    {selectedUser.profile_picture ? (
                                        <img
                                            src={`http://localhost:5000/uploads/${selectedUser.profile_picture}`}
                                            alt={selectedUser.name}
                                        />
                                    ) : (
                                        <span>{selectedUser.name?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="user-details">
                                    <h4>{selectedUser.name}</h4>
                                    <p>@{selectedUser.username}</p>
                                </div>
                                <button
                                    className="change-recipient-btn"
                                    onClick={() => setSelectedUser(null)}
                                    type="button"
                                >
                                    Changer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Zone de message */}
                    {selectedUser && (
                        <form className="message-form" onSubmit={sendMessage}>
                            <label htmlFor="message-text">Message :</label>
                            <textarea
                                id="message-text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tapez votre message..."
                                className="message-textarea"
                                rows={4}
                                maxLength={1000}
                                required
                            />
                            <div className="character-count">
                                {message.length}/1000
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={handleClose}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="send-btn"
                                    disabled={!message.trim() || sending}
                                >
                                    {sending ? (
                                        <>
                                            <div className="spinner-small"></div>
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane />
                                            Envoyer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MessageModal;
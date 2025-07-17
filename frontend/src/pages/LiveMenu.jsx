import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaPlay,
    FaUsers,
    FaClock,
    FaGraduationCap,
    FaVideo,
    FaPlus,
    FaSearch,
    FaEye,
    FaLock,
    FaGlobe
} from 'react-icons/fa';
import './LiveMenu.css';

function LiveMenu() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Configuration API
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // États principaux
    const [activeSessions, setActiveSessions] = useState([]);
    const [mySessions, setMySessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchCode, setSearchCode] = useState('');

    // États pour créer une session
    const [newSession, setNewSession] = useState({
        title: '',
        description: '',
        subject: '',
        maxParticipants: 30,
        password: '',
        isPrivate: false
    });

    useEffect(() => {
        console.log('🎯 LiveMenu - Initialisation');
        console.log('User:', user);
        console.log('Token présent:', !!token);
        console.log('API_URL:', API_URL);

        if (!token) {
            console.log('❌ Pas de token, redirection vers connexion');
            navigate('/connexion');
            return;
        }
        fetchLiveSessions();
    }, [token, navigate, API_URL]);

    const fetchLiveSessions = async () => {
        try {
            setLoading(true);
            console.log('📡 Récupération des sessions live...');

            // Récupérer les sessions actives
            const activeResponse = await axios.get(`${API_URL}/api/live/active-sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Sessions actives récupérées:', activeResponse.data?.length || 0);
            setActiveSessions(activeResponse.data || []);

            // Si l'utilisateur est professeur ou parent, récupérer ses sessions
            if (user?.accountType === 'teacher' || user?.accountType === 'parent') {
                try {
                    const myResponse = await axios.get(`${API_URL}/api/live/my-sessions`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('✅ Mes sessions récupérées:', myResponse.data?.length || 0);
                    setMySessions(myResponse.data || []);
                } catch (error) {
                    console.error('⚠️ Erreur récupération mes sessions:', error);
                    // Continue même si erreur pour mes sessions
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des sessions:', error);
            if (error.response?.status === 401) {
                console.log('🔒 Erreur d\'authentification, redirection');
                navigate('/connexion');
            } else {
                alert('Erreur lors du chargement des sessions');
            }
        } finally {
            setLoading(false);
        }
    };

    const createSession = async (e) => {
        e.preventDefault();

        if (!newSession.title.trim()) {
            alert('Le titre est obligatoire');
            return;
        }

        try {
            console.log('🎬 Création de session:', newSession.title);

            const sessionData = {
                title: newSession.title.trim(),
                description: newSession.description.trim(),
                subject: newSession.subject.trim(),
                maxParticipants: parseInt(newSession.maxParticipants) || 30,
                password: newSession.password.trim() || null
            };

            console.log('📋 Données à envoyer:', sessionData);

            const response = await axios.post(`${API_URL}/api/live/create-session`,
                sessionData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✅ Session créée:', response.data);

            setShowCreateModal(false);
            setNewSession({
                title: '',
                description: '',
                subject: '',
                maxParticipants: 30,
                password: '',
                isPrivate: false
            });

            // Actualiser la liste
            await fetchLiveSessions();

            // Naviguer vers la session créée
            const sessionId = response.data.sessionId || response.data.id;
            if (sessionId) {
                console.log('🚀 Navigation vers session:', sessionId);
                navigate(`/live/session/${sessionId}`);
            }

        } catch (error) {
            console.error('❌ Erreur lors de la création:', error);
            const errorMessage = error.response?.data?.error || 'Erreur lors de la création de la session';
            alert(errorMessage);
        }
    };

    const joinSession = async (sessionId, needsPassword = false) => {
        try {
            console.log('🔗 Tentative de connexion à session:', sessionId);

            let joinData = {};

            if (needsPassword) {
                const password = prompt('Cette session est protégée par un mot de passe :');
                if (!password) return;
                joinData.password = password;
            }

            const response = await axios.post(`${API_URL}/api/live/join-session/${sessionId}`,
                joinData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✅ Connexion réussie:', response.data.message);
            navigate(`/live/session/${sessionId}`);

        } catch (error) {
            console.error('❌ Erreur lors de la connexion:', error);

            if (error.response?.status === 401) {
                alert('Mot de passe incorrect');
            } else if (error.response?.status === 400) {
                alert('Session complète ou non disponible');
            } else if (error.response?.status === 404) {
                alert('Session introuvable');
            } else {
                alert(error.response?.data?.error || 'Impossible de rejoindre cette session');
            }
        }
    };

    const joinByCode = async () => {
        const code = searchCode.trim();
        if (!code) {
            alert('Veuillez entrer un code de session');
            return;
        }

        try {
            console.log('🔍 Recherche par code:', code);

            const response = await axios.get(`${API_URL}/api/live/session-by-code/${code}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Session trouvée par code:', response.data);
            const sessionId = response.data.sessionId || response.data.id;
            const hasPassword = response.data.hasPassword || !!response.data.password;

            if (sessionId) {
                joinSession(sessionId, hasPassword);
            }
        } catch (error) {
            console.error('❌ Erreur recherche par code:', error);
            alert(error.response?.data?.error || 'Code de session invalide');
        }
    };

    const startSession = async (sessionId) => {
        try {
            console.log('▶️ Démarrage session:', sessionId);

            await axios.post(`${API_URL}/api/live/start-session/${sessionId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Session démarrée');
            navigate(`/live/session/${sessionId}`);
        } catch (error) {
            console.error('❌ Erreur démarrage:', error);
            alert(error.response?.data?.error || 'Impossible de démarrer la session');
        }
    };

    const endSession = async (sessionId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir terminer cette session ?')) return;

        try {
            console.log('⏹️ Fin session:', sessionId);

            await axios.post(`${API_URL}/api/live/end-session/${sessionId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Session terminée');
            fetchLiveSessions();
        } catch (error) {
            console.error('❌ Erreur fin session:', error);
            alert(error.response?.data?.error || 'Impossible de terminer la session');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'live': return '#28a745';
            case 'waiting': return '#ffc107';
            case 'ended': return '#6c757d';
            default: return '#007bff';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'live': return 'EN DIRECT';
            case 'waiting': return 'EN ATTENTE';
            case 'ended': return 'TERMINÉ';
            default: return 'INCONNU';
        }
    };

    if (loading) {
        return (
            <div className="live-menu-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement des sessions live...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="live-menu-container">
            <div className="live-menu-header">
                <h1>
                    <FaVideo className="header-icon" />
                    Centre Live MSA
                </h1>
                <p>Rejoignez ou créez des sessions d'apprentissage en direct</p>
                <small>API: {API_URL}</small>
            </div>

            {/* Barre d'actions */}
            <div className="live-actions">
                <div className="search-section">
                    <div className="search-input-group">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Entrez un code de session (ex: AB1234)"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                            className="search-input"
                            maxLength={8}
                            onKeyPress={(e) => e.key === 'Enter' && joinByCode()}
                        />
                        <button onClick={joinByCode} className="search-btn">
                            Rejoindre
                        </button>
                    </div>
                </div>

                {(user?.accountType === 'teacher' || user?.accountType === 'parent') && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="create-session-btn"
                    >
                        <FaPlus /> Créer une session
                    </button>
                )}
            </div>

            {/* Sessions actives */}
            <div className="sessions-section">
                <h2>
                    <FaPlay className="section-icon" />
                    Sessions en cours ({activeSessions.filter(s => s.status === 'live').length})
                </h2>

                <div className="sessions-grid">
                    {activeSessions.filter(s => s.status === 'live').map(session => (
                        <div key={session.id} className="session-card live">
                            <div className="session-status" style={{ backgroundColor: getStatusColor(session.status) }}>
                                {getStatusText(session.status)}
                            </div>

                            <div className="session-content">
                                <h3>{session.title}</h3>
                                <p className="session-subject">
                                    <FaGraduationCap /> {session.subject || 'Matière non spécifiée'}
                                </p>
                                <p className="session-teacher">
                                    Par: {session.teacher_name}
                                </p>
                                <p className="session-description">{session.description || 'Aucune description'}</p>

                                <div className="session-info">
                                    <span className="participants">
                                        <FaUsers /> {session.current_participants || 0}/{session.max_participants}
                                    </span>
                                    <span className="room-code">
                                        Code: {session.room_code}
                                    </span>
                                    {session.password && <FaLock className="private-icon" />}
                                    {!session.password && <FaGlobe className="public-icon" />}
                                </div>
                            </div>

                            <div className="session-actions">
                                <button
                                    onClick={() => joinSession(session.id, !!session.password)}
                                    className="join-btn"
                                    disabled={session.current_participants >= session.max_participants}
                                >
                                    <FaEye /> Rejoindre
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {activeSessions.filter(s => s.status === 'live').length === 0 && (
                    <div className="no-sessions">
                        <FaVideo className="no-sessions-icon" />
                        <p>Aucune session live en cours actuellement</p>
                        <span>Revenez plus tard ou créez votre propre session !</span>
                    </div>
                )}
            </div>

            {/* Sessions en attente */}
            <div className="sessions-section">
                <h2>
                    <FaClock className="section-icon" />
                    Sessions en attente ({activeSessions.filter(s => s.status === 'waiting').length})
                </h2>

                <div className="sessions-grid">
                    {activeSessions.filter(s => s.status === 'waiting').map(session => (
                        <div key={session.id} className="session-card waiting">
                            <div className="session-status" style={{ backgroundColor: getStatusColor(session.status) }}>
                                {getStatusText(session.status)}
                            </div>

                            <div className="session-content">
                                <h3>{session.title}</h3>
                                <p className="session-subject">
                                    <FaGraduationCap /> {session.subject || 'Matière non spécifiée'}
                                </p>
                                <p className="session-teacher">
                                    Par: {session.teacher_name}
                                </p>
                                <p className="session-description">{session.description || 'Aucune description'}</p>

                                <div className="session-info">
                                    <span className="participants">
                                        <FaUsers /> {session.current_participants || 0}/{session.max_participants}
                                    </span>
                                    <span className="room-code">
                                        Code: {session.room_code}
                                    </span>
                                    {session.password && <FaLock className="private-icon" />}
                                    {!session.password && <FaGlobe className="public-icon" />}
                                </div>
                            </div>

                            <div className="session-actions">
                                <button
                                    onClick={() => joinSession(session.id, !!session.password)}
                                    className="join-btn"
                                    disabled={session.current_participants >= session.max_participants}
                                >
                                    <FaEye /> Rejoindre
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {activeSessions.filter(s => s.status === 'waiting').length === 0 && (
                    <div className="no-sessions">
                        <FaClock className="no-sessions-icon" />
                        <p>Aucune session en attente actuellement</p>
                        <span>Les sessions apparaîtront ici avant leur démarrage</span>
                    </div>
                )}
            </div>

            {/* Mes sessions (pour les professeurs) */}
            {(user?.accountType === 'teacher' || user?.accountType === 'parent') && (
                <div className="sessions-section">
                    <h2>
                        <FaGraduationCap className="section-icon" />
                        Mes sessions ({mySessions.length})
                    </h2>

                    <div className="sessions-grid">
                        {mySessions.map(session => (
                            <div key={session.id} className={`session-card ${session.status}`}>
                                <div className="session-status" style={{ backgroundColor: getStatusColor(session.status) }}>
                                    {getStatusText(session.status)}
                                </div>

                                <div className="session-content">
                                    <h3>{session.title}</h3>
                                    <p className="session-subject">
                                        <FaGraduationCap /> {session.subject || 'Matière non spécifiée'}
                                    </p>
                                    <p className="session-description">{session.description || 'Aucune description'}</p>

                                    <div className="session-info">
                                        <span className="participants">
                                            <FaUsers /> {session.current_participants || 0}/{session.max_participants}
                                        </span>
                                        <span className="room-code">
                                            Code: {session.room_code}
                                        </span>
                                        {session.password ? <FaLock className="private-icon" /> : <FaGlobe className="public-icon" />}
                                    </div>

                                    {session.status === 'live' && session.started_at && (
                                        <p className="session-time">
                                            <FaClock /> Démarré le {new Date(session.started_at).toLocaleString('fr-FR')}
                                        </p>
                                    )}

                                    {session.status === 'waiting' && (
                                        <p className="session-time">
                                            <FaClock /> Créé le {new Date(session.created_at).toLocaleString('fr-FR')}
                                        </p>
                                    )}
                                </div>

                                <div className="session-actions">
                                    {session.status === 'waiting' && (
                                        <button
                                            onClick={() => startSession(session.id)}
                                            className="start-btn"
                                        >
                                            <FaPlay /> Démarrer
                                        </button>
                                    )}

                                    {session.status === 'live' && (
                                        <>
                                            <button
                                                onClick={() => navigate(`/live/session/${session.id}`)}
                                                className="join-btn"
                                            >
                                                <FaEye /> Rejoindre
                                            </button>
                                            <button
                                                onClick={() => endSession(session.id)}
                                                className="end-btn"
                                            >
                                                Terminer
                                            </button>
                                        </>
                                    )}

                                    {session.status === 'ended' && (
                                        <button className="view-btn" disabled>
                                            Terminée
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {mySessions.length === 0 && (
                        <div className="no-sessions">
                            <FaGraduationCap className="no-sessions-icon" />
                            <p>Vous n'avez pas encore créé de session</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="create-first-session-btn"
                            >
                                <FaPlus /> Créer ma première session
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de création de session */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Créer une nouvelle session live</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="modal-close"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={createSession} className="modal-content">
                            <div className="form-group">
                                <label>Titre de la session *</label>
                                <input
                                    type="text"
                                    value={newSession.title}
                                    onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                                    required
                                    placeholder="Ex: Cours de Mathématiques - Les Fractions"
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-group">
                                <label>Matière</label>
                                <input
                                    type="text"
                                    value={newSession.subject}
                                    onChange={(e) => setNewSession({...newSession, subject: e.target.value})}
                                    placeholder="Ex: Mathématiques, Sciences, Histoire..."
                                    maxLength={50}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newSession.description}
                                    onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                                    placeholder="Décrivez brièvement le contenu de votre session..."
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre max de participants</label>
                                    <input
                                        type="number"
                                        value={newSession.maxParticipants}
                                        onChange={(e) => setNewSession({...newSession, maxParticipants: parseInt(e.target.value) || 30})}
                                        min={1}
                                        max={100}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Mot de passe (optionnel)</label>
                                    <input
                                        type="password"
                                        value={newSession.password}
                                        onChange={(e) => setNewSession({...newSession, password: e.target.value})}
                                        placeholder="Laisser vide pour session publique"
                                        maxLength={20}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-btn">
                                    Annuler
                                </button>
                                <button type="submit" className="create-btn">
                                    <FaPlus /> Créer la session
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LiveMenu;
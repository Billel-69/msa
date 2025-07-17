import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    FaChild,
    FaPlus,
    FaEye,
    FaChartLine,
    FaClock,
    FaTrophy,
    FaGamepad,
    FaBook,
    FaStar,
    FaCalendarAlt,
    FaUserPlus,
    FaCog
} from 'react-icons/fa';
import './ParentDashboard.css';

function ParentDashboard() {
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, progress, activity, settings

    const { token, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.accountType !== 'parent') {
            navigate('/');
            return;
        }
        fetchChildren();
    }, [user, navigate]);

    const fetchChildren = async () => {
        try {
            const response = await axios.get(
                'http://localhost:5000/api/auth/my-children',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setChildren(response.data);
            if (response.data.length > 0) {
                setSelectedChild(response.data[0]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des enfants:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderOverviewTab = () => (
        <div className="overview-tab">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaClock />
                    </div>
                    <div className="stat-info">
                        <h3>Temps d'apprentissage</h3>
                        <p className="stat-value">2h 30m</p>
                        <span className="stat-period">Cette semaine</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaTrophy />
                    </div>
                    <div className="stat-info">
                        <h3>Quêtes complétées</h3>
                        <p className="stat-value">{selectedChild?.quests_completed || 0}</p>
                        <span className="stat-period">Total</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaStar />
                    </div>
                    <div className="stat-info">
                        <h3>Fragments collectés</h3>
                        <p className="stat-value">{selectedChild?.fragments || 0}</p>
                        <span className="stat-period">Total</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaBook />
                    </div>
                    <div className="stat-info">
                        <h3>Niveau actuel</h3>
                        <p className="stat-value">Niveau {selectedChild?.level || 1}</p>
                        <span className="stat-period">Rang: {selectedChild?.rank || 'Débutant'}</span>
                    </div>
                </div>
            </div>

            <div className="recent-activity">
                <h3>Activité récente</h3>
                <div className="activity-list">
                    <div className="activity-item">
                        <div className="activity-icon">🎯</div>
                        <div className="activity-details">
                            <p><strong>Quête "Mathématiques" complétée</strong></p>
                            <span>Il y a 2 heures</span>
                        </div>
                        <div className="activity-reward">+10 fragments</div>
                    </div>

                    <div className="activity-item">
                        <div className="activity-icon">📚</div>
                        <div className="activity-details">
                            <p><strong>Nouveau niveau atteint en Français</strong></p>
                            <span>Hier</span>
                        </div>
                        <div className="activity-reward">Niveau 3</div>
                    </div>

                    <div className="activity-item">
                        <div className="activity-icon">🏆</div>
                        <div className="activity-details">
                            <p><strong>Badge "Explorateur" débloqué</strong></p>
                            <span>Il y a 3 jours</span>
                        </div>
                        <div className="activity-reward">Nouveau badge</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProgressTab = () => (
        <div className="progress-tab">
            <div className="subject-progress">
                <h3>Progression par matière</h3>
                <div className="subjects-grid">
                    {['Mathématiques', 'Français', 'Sciences', 'Histoire', 'Anglais', 'Arts'].map((subject) => (
                        <div key={subject} className="subject-card">
                            <h4>{subject}</h4>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                                ></div>
                            </div>
                            <div className="subject-stats">
                                <span>Niveau {Math.floor(Math.random() * 5) + 1}</span>
                                <span>{Math.floor(Math.random() * 50)} quêtes</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="weekly-chart">
                <h3>Activité de la semaine</h3>
                <div className="chart-placeholder">
                    <div className="chart-bars">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
                            <div key={day} className="chart-bar">
                                <div
                                    className="bar-fill"
                                    style={{ height: `${Math.random() * 100}%` }}
                                ></div>
                                <span>{day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderActivityTab = () => (
        <div className="activity-tab">
            <div className="time-controls">
                <h3>Contrôles parentaux</h3>
                <div className="controls-grid">
                    <div className="control-card">
                        <h4>Temps d'écran quotidien</h4>
                        <div className="time-selector">
                            <button className="time-btn">30 min</button>
                            <button className="time-btn active">1h</button>
                            <button className="time-btn">2h</button>
                            <button className="time-btn">Illimité</button>
                        </div>
                    </div>

                    <div className="control-card">
                        <h4>Plages horaires autorisées</h4>
                        <div className="time-ranges">
                            <div className="time-range">
                                <span>Matin: 9h00 - 12h00</span>
                                <button className="toggle-btn active">✓</button>
                            </div>
                            <div className="time-range">
                                <span>Après-midi: 14h00 - 17h00</span>
                                <button className="toggle-btn active">✓</button>
                            </div>
                            <div className="time-range">
                                <span>Soir: 18h00 - 20h00</span>
                                <button className="toggle-btn">○</button>
                            </div>
                        </div>
                    </div>

                    <div className="control-card">
                        <h4>Matières autorisées</h4>
                        <div className="subjects-toggle">
                            {['Mathématiques', 'Français', 'Sciences', 'Histoire'].map((subject) => (
                                <div key={subject} className="subject-toggle">
                                    <span>{subject}</span>
                                    <button className="toggle-btn active">✓</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="settings-tab">
            <div className="settings-sections">
                <div className="settings-section">
                    <h3>Gestion du compte enfant</h3>
                    <div className="settings-options">
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Nom d'utilisateur</h4>
                                <p>{selectedChild?.username}</p>
                            </div>
                            <button className="setting-btn">Modifier</button>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Email</h4>
                                <p>{selectedChild?.email}</p>
                            </div>
                            <button className="setting-btn">Modifier</button>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Mot de passe</h4>
                                <p>••••••••</p>
                            </div>
                            <button className="setting-btn">Changer</button>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Notifications</h3>
                    <div className="notification-settings">
                        <div className="notification-item">
                            <span>Rapport quotidien d'activité</span>
                            <button className="toggle-btn active">✓</button>
                        </div>
                        <div className="notification-item">
                            <span>Nouveaux accomplissements</span>
                            <button className="toggle-btn active">✓</button>
                        </div>
                        <div className="notification-item">
                            <span>Rappels de temps d'écran</span>
                            <button className="toggle-btn">○</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <div className="parent-dashboard loading">Chargement...</div>;
    }

    if (children.length === 0) {
        return (
            <div className="parent-dashboard empty">
                <div className="empty-state">
                    <FaChild className="empty-icon" />
                    <h2>Aucun enfant lié</h2>
                    <p>Commencez par ajouter un compte enfant pour accéder au tableau de bord.</p>
                    <button
                        className="add-child-btn"
                        onClick={() => navigate('/parent-setup')}
                    >
                        <FaPlus /> Ajouter un enfant
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="parent-dashboard">
            <div className="dashboard-header">
                <h1>Tableau de bord parent</h1>
                <button
                    className="add-child-btn"
                    onClick={() => navigate('/parent-setup')}
                >
                    <FaPlus /> Ajouter un enfant
                </button>
            </div>

            <div className="children-selector">
                <h2>Mes enfants</h2>
                <div className="children-tabs">
                    {children.map((child) => (
                        <div
                            key={child.id}
                            className={`child-tab ${selectedChild?.id === child.id ? 'active' : ''}`}
                            onClick={() => setSelectedChild(child)}
                        >
                            <div className="child-avatar">
                                {child.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{child.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {selectedChild && (
                <div className="dashboard-content">
                    <div className="tab-navigation">
                        <button
                            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <FaChartLine /> Vue d'ensemble
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
                            onClick={() => setActiveTab('progress')}
                        >
                            <FaTrophy /> Progression
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('activity')}
                        >
                            <FaClock /> Contrôles
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <FaCog /> Paramètres
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'overview' && renderOverviewTab()}
                        {activeTab === 'progress' && renderProgressTab()}
                        {activeTab === 'activity' && renderActivityTab()}
                        {activeTab === 'settings' && renderSettingsTab()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ParentDashboard;
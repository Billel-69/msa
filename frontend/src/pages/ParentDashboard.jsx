import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
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
    FaCog,
    FaChartBar, // Added for charts
    FaBookOpen, // Added for subjects
    FaHistory, // Added for activity
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
            const response = await axiosInstance.get('/auth/my-children');
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
        <div className="overview-tab-reworked">
            <div className="stats-grid-reworked">
                <div className="stat-card-reworked">
                    <div className="card-header-reworked">
                        <span className="card-title-reworked">Temps d'apprentissage</span>
                        <FaClock className="card-icon-reworked" />
                    </div>
                    <p className="card-value-reworked">2h 30m</p>
                    <span className="card-period-reworked">Cette semaine</span>
                </div>

                <div className="stat-card-reworked">
                    <div className="card-header-reworked">
                        <span className="card-title-reworked">Quêtes complétées</span>
                        <FaTrophy className="card-icon-reworked" />
                    </div>
                    <p className="card-value-reworked">{selectedChild?.quests_completed || 0}</p>
                    <span className="card-period-reworked">Total</span>
                </div>

                <div className="stat-card-reworked">
                    <div className="card-header-reworked">
                        <span className="card-title-reworked">Fragments collectés</span>
                        <FaStar className="card-icon-reworked" />
                    </div>
                    <p className="card-value-reworked">{selectedChild?.fragments || 0}</p>
                    <span className="card-period-reworked">Total</span>
                </div>

                <div className="stat-card-reworked">
                    <div className="card-header-reworked">
                        <span className="card-title-reworked">Niveau actuel</span>
                        <FaChartLine className="card-icon-reworked" />
                    </div>
                    <p className="card-value-reworked">{selectedChild?.level || 1}</p>
                    <span className="card-period-reworked">Rang: {selectedChild?.rank || 'Débutant'}</span>
                </div>
            </div>

            <div className="mini-games-reworked">
                <h3 className="section-title-reworked">Mini-Jeux</h3>
                <div className="game-card-reworked" onClick={() => navigate('/quiz-game')}>
                    <div className="game-card-icon-reworked">
                        <FaGamepad />
                    </div>
                    <div className="game-card-details-reworked">
                        <span className="game-card-title-reworked">Quiz Interactif</span>
                        <p className="game-card-description-reworked">Testez vos connaissances et gagnez des récompenses.</p>
                    </div>
                </div>
            </div>

            <div className="recent-activity-reworked">
                <h3 className="section-title-reworked">Activité Récente</h3>
                <div className="activity-item-reworked">
                    <div className="activity-icon-reworked" style={{ backgroundColor: 'var(--db-success-light)', color: 'var(--db-success)' }}><FaBookOpen /></div>
                    <div className="activity-details-reworked">
                        <p>Quête "Mathématiques" complétée</p>
                        <span>Il y a 2 heures</span>
                    </div>
                    <span className="activity-reward-reworked">+10 fragments</span>
                </div>
                <div className="activity-item-reworked">
                    <div className="activity-icon-reworked" style={{ backgroundColor: 'var(--db-success-light)', color: 'var(--db-success)' }}><FaChartLine /></div>
                    <div className="activity-details-reworked">
                        <p>Nouveau niveau atteint en Français</p>
                        <span>Hier</span>
                    </div>
                    <span className="activity-reward-reworked">Niveau 3</span>
                </div>
                <div className="activity-item-reworked">
                    <div className="activity-icon-reworked" style={{ backgroundColor: 'var(--db-success-light)', color: 'var(--db-success)' }}><FaTrophy /></div>
                    <div className="activity-details-reworked">
                        <p>Badge "Explorateur" débloqué</p>
                        <span>Il y a 3 jours</span>
                    </div>
                    <span className="activity-reward-reworked">Nouveau badge</span>
                </div>
            </div>
        </div>
    );

    const renderProgressTab = () => (
        <div className="progress-tab-reworked">
            <div className="card-reworked">
                <h3 className="section-title-reworked">Progression par Matière</h3>
                <div className="subjects-grid-reworked">
                    {['Mathématiques', 'Français', 'Sciences', 'Histoire', 'Anglais', 'Arts'].map((subject) => (
                        <div key={subject} className="subject-progress-item-reworked">
                            <div className="subject-info-reworked">
                                <span>{subject}</span>
                                <span>{Math.floor(Math.random() * 100)}%</span>
                            </div>
                            <div className="progress-bar-container-reworked">
                                <div
                                    className="progress-bar-fill-reworked"
                                    style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="card-reworked">
                <h3 className="section-title-reworked">Activité de la Semaine (Heures)</h3>
                <div className="weekly-chart-reworked">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                        <div key={day} className="chart-bar-reworked">
                            <div className="bar-fill-reworked" style={{ height: `${Math.random() * 150}px` }}></div>
                            <span>{day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderActivityTab = () => (
        <div className="activity-tab-reworked">
            <div className="activity-filter">
                <h3>Filtrer l'activité</h3>
                <form className="filter-form">
                    <div className="form-group">
                        <label htmlFor="activity-type">Type d'activité</label>
                        <select id="activity-type">
                            <option value="all">Toutes</option>
                            <option value="quests">Quêtes</option>
                            <option value="games">Mini-jeux</option>
                            <option value="login">Connexions</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="activity-date">Date</label>
                        <input type="date" id="activity-date" />
                    </div>
                    <button type="submit" className="btn-reworked-secondary">Appliquer</button>
                </form>
            </div>

            <div className="recent-activity-reworked" style={{ marginTop: '2rem' }}>
                <h3 className="section-title-reworked">Journal d'activité de {selectedChild?.username}</h3>
                <div className="activity-item-reworked">
                    <div className="activity-icon-reworked" style={{ backgroundColor: 'var(--db-success-light)', color: 'var(--db-success)' }}><FaBookOpen /></div>
                    <div className="activity-details-reworked">
                        <p>Quête "Mathématiques - Chapitre 1" complétée</p>
                        <span>Aujourd'hui, 14:30</span>
                    </div>
                    <span className="activity-reward-reworked">+15 fragments</span>
                </div>
                <div className="activity-item-reworked">
                    <div className="activity-icon-reworked" style={{ backgroundColor: 'var(--db-success-light)', color: 'var(--db-success)' }}><FaGamepad /></div>
                    <div className="activity-details-reworked">
                        <p>A joué à "Calcul Rapide" pendant 20 minutes</p>
                        <span>Aujourd'hui, 11:10</span>
                    </div>
                    <span className="activity-reward-reworked">Score: 2100</span>
                </div>
                 <div className="activity-item-reworked">
                    <div className="activity-icon-reworked" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#a9a2c2' }}><FaUserPlus /></div>
                    <div className="activity-details-reworked">
                        <p>Connexion à la plateforme</p>
                        <span>Aujourd'hui, 11:05</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="settings-tab-reworked">
            <div className="settings-section">
                <h3>Gestion du compte de {selectedChild?.username}</h3>
                <div className="form-group">
                    <label htmlFor="username">Nom d'utilisateur</label>
                    <input type="text" id="username" defaultValue={selectedChild?.username} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" defaultValue={selectedChild?.email} />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Nouveau mot de passe</label>
                    <input type="password" id="password" placeholder="Laisser vide pour ne pas changer" />
                </div>
                <button className="btn-reworked-primary">Sauvegarder les modifications</button>
            </div>

            <div className="settings-section">
                <h3>Notifications par email</h3>
                <div className="form-group">
                    <label>Rapport d'activité</label>
                    <select>
                        <option>Jamais</option>
                        <option selected>Quotidien</option>
                        <option>Hebdomadaire</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Alertes d'accomplissement</label>
                    <select>
                        <option>Désactivées</option>
                        <option selected>Activées</option>
                    </select>
                </div>
                <button className="btn-reworked-primary">Gérer les notifications</button>
            </div>
        </div>
    );

    if (loading) {
        return <div>Chargement...</div>;
    }

    if (children.length === 0) {
        return (
            <div className="parent-dashboard-reworked empty">
                <div className="empty-state-reworked">
                    <div className="empty-icon-reworked"><FaUserPlus /></div>
                    <h2>Aucun enfant n'est encore ajouté</h2>
                    <p>Commencez par ajouter votre premier enfant pour suivre ses progrès.</p>
                    <button className="add-child-btn-reworked" onClick={() => navigate('/add-child')}>
                        <FaPlus />
                        Ajouter un enfant
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="parent-dashboard-reworked">
            <header className="dashboard-header-reworked">
                <h1>Tableau de Bord Parent</h1>
                <button className="add-child-btn-reworked" onClick={() => navigate('/add-child')}>
                    <FaPlus />
                    Ajouter un enfant
                </button>
            </header>

            <div className="children-selector-reworked">
                {children.map((child) => (
                    <div
                        key={child._id}
                        className={`child-tab-reworked ${selectedChild?._id === child._id ? 'active' : ''}`}
                        onClick={() => setSelectedChild(child)}
                    >
                        <div className="child-avatar-reworked">
                            <img src={child.profilePicture || '/default-avatar.png'} alt={child.username} />
                        </div>
                        <span>{child.username}</span>
                    </div>
                ))}
            </div>

            {selectedChild && (
                <>
                    <div className="dashboard-tabs-reworked">
                        <button
                            className={`tab-btn-reworked ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <FaEye /> Vue d'ensemble
                        </button>
                        <button
                            className={`tab-btn-reworked ${activeTab === 'progress' ? 'active' : ''}`}
                            onClick={() => setActiveTab('progress')}
                        >
                            <FaChartLine /> Progression
                        </button>
                        <button
                            className={`tab-btn-reworked ${activeTab === 'activity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('activity')}
                        >
                            <FaHistory /> Activité
                        </button>
                        <button
                            className={`tab-btn-reworked ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <FaCog /> Paramètres
                        </button>
                    </div>

                    <div className="dashboard-content-reworked">
                        {activeTab === 'overview' && renderOverviewTab()}
                        {activeTab === 'progress' && renderProgressTab()}
                        {activeTab === 'activity' && renderActivityTab()}
                        {activeTab === 'settings' && renderSettingsTab()}
                    </div>
                </>
            )}
        </div>
    );
}

export default ParentDashboard;
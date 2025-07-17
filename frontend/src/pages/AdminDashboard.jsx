import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import './AdminDashboard-Glass.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Vérifier si l'utilisateur est admin
        if (!user || user.accountType !== 'admin') {
            navigate('/');
            return;
        }
        
        fetchDashboardData();
    }, [user, navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Récupérer les statistiques
            console.log('Fetching stats from:', `${API_BASE_URL}/admin/stats`);
            const statsResponse = await fetch(`${API_BASE_URL}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Stats response status:', statsResponse.status);
            
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
                console.log('Stats data:', statsData);
            } else {
                const errorText = await statsResponse.text();
                console.error('Stats error response:', errorText);
                setError(`Erreur stats: ${statsResponse.status} - ${errorText.substring(0, 100)}`);
            }

            // Récupérer la liste des utilisateurs
            console.log('Fetching users from:', `${API_BASE_URL}/admin/users?limit=10`);
            const usersResponse = await fetch(`${API_BASE_URL}/admin/users?limit=10`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Users response status:', usersResponse.status);
            
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setUsers(usersData.users || []);
                console.log('Users data:', usersData);
            } else {
                const errorText = await usersResponse.text();
                console.error('Users error response:', errorText);
                setError(`Erreur utilisateurs: ${usersResponse.status} - ${errorText.substring(0, 100)}`);
            }
            
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            setError(`Erreur réseau: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="admin-loading">
                    <div className="spinner"></div>
                    <p>Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <div className="admin-header-left">
                    <h1>🛡️ Administration</h1>
                    <span className="admin-subtitle">Panneau de contrôle</span>
                </div>
                <div className="admin-header-right">
                    <span className="admin-user-info">
                        👤 {user?.name} 
                        {user?.isSuperAdmin && <span className="super-admin-badge">SUPER ADMIN</span>}
                    </span>
                    <button onClick={handleLogout} className="logout-btn">
                        Déconnexion
                    </button>
                </div>
            </div>

            <div className="admin-content">
                <nav className="admin-nav">
                    <button 
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <div className="nav-icon">📊</div>
                        <div className="nav-content">
                            <span className="nav-title">Tableau de bord</span>
                            <span className="nav-subtitle">Vue d'ensemble</span>
                        </div>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <div className="nav-icon">👥</div>
                        <div className="nav-content">
                            <span className="nav-title">Utilisateurs</span>
                            <span className="nav-subtitle">Gestion & modération</span>
                        </div>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        <div className="nav-icon">🚨</div>
                        <div className="nav-content">
                            <span className="nav-title">Signalements</span>
                            <span className="nav-subtitle">Bientôt disponible</span>
                        </div>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        <div className="nav-icon">📋</div>
                        <div className="nav-content">
                            <span className="nav-title">Logs d'activité</span>
                            <span className="nav-subtitle">Audit & historique</span>
                        </div>
                    </button>
                </nav>

                <main className="admin-main">
                    {error && <div className="error-message">{error}</div>}
                    
                    {activeTab === 'dashboard' && (
                        <DashboardStats stats={stats} />
                    )}
                    
                    {activeTab === 'users' && (
                        <UsersManagement users={users} onRefresh={fetchDashboardData} />
                    )}
                    
                    {activeTab === 'reports' && (
                        <div className="coming-soon">
                            <h2>🚨 Gestion des signalements</h2>
                            <p>Cette fonctionnalité sera disponible dans la Phase 2</p>
                        </div>
                    )}
                    
                    {activeTab === 'logs' && (
                        <div className="coming-soon">
                            <h2>📋 Logs d'administration</h2>
                            <p>Cette fonctionnalité sera disponible prochainement</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// Composant pour les statistiques du tableau de bord
const DashboardStats = ({ stats }) => {
    const statsData = [
        {
            icon: '👥',
            value: stats.totalUsers || 0,
            label: 'Utilisateurs Total',
            change: '+12%',
            color: 'blue'
        },
        {
            icon: '👨‍👩‍👧‍👦',
            value: stats.totalParents || 0,
            label: 'Parents',
            change: '+8%',
            color: 'green'
        },
        {
            icon: '🧒',
            value: stats.totalChildren || 0,
            label: 'Enfants',
            change: '+15%',
            color: 'purple'
        },
        {
            icon: '👨‍🏫',
            value: stats.totalTeachers || 0,
            label: 'Enseignants',
            change: '+5%',
            color: 'orange'
        },
        {
            icon: '📝',
            value: stats.totalPosts || 0,
            label: 'Publications',
            change: '+23%',
            color: 'blue'
        },
        {
            icon: '🎮',
            value: stats.totalGames || 0,
            label: 'Mini-jeux',
            change: '+3%',
            color: 'green'
        },
        {
            icon: '✨',
            value: stats.newUsersToday || 0,
            label: 'Nouveaux Aujourd\'hui',
            change: 'Today',
            color: 'purple'
        },
        {
            icon: '📈',
            value: stats.activeUsersLast7Days || 0,
            label: 'Actifs (7 jours)',
            change: '+18%',
            color: 'orange'
        }
    ];

    return (
        <div className="dashboard-stats">
            <h2>📊 Vue d'ensemble de la plateforme</h2>
            
            <div className="stats-grid">
                {statsData.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className={`stat-icon stat-icon-${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <h3>{stat.value.toLocaleString()}</h3>
                            <p>{stat.label}</p>
                            <div className="stat-change">
                                <span className={`change-indicator ${stat.change.includes('+') ? 'positive' : 'neutral'}`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Composant pour la gestion des utilisateurs
const UsersManagement = ({ users, onRefresh }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const handleUserAction = async (userId, action, data = {}) => {
        try {
            setActionLoading(true);
            
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                await onRefresh();
                setShowUserModal(false);
            } else {
                const errorText = await response.text();
                let errorMessage = 'Action échouée';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText.substring(0, 100);
                }
                alert(`Erreur: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Erreur action utilisateur:', error);
            alert('Erreur lors de l\'action');
        } finally {
            setActionLoading(false);
        }
    };

    const openUserModal = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    return (
        <div className="users-management">
            <h2>👥 Gestion des utilisateurs</h2>
            
            <div className="users-table">
                <div className="table-header">
                    <div>Nom</div>
                    <div>Email</div>
                    <div>Type</div>
                    <div>Statut</div>
                    <div>Niveau</div>
                    <div>Actions</div>
                </div>
                
                {users.map(user => (
                    <div key={user.id} className="table-row">
                        <div className="user-name">
                            <img 
                                src={user.profile_picture || '/default-avatar.png'} 
                                alt="Avatar"
                                className="user-avatar"
                            />
                            <span>{user.name}</span>
                        </div>
                        <div>{user.email}</div>
                        <div>
                            <span className={`user-type ${user.account_type}`}>
                                {user.account_type}
                            </span>
                        </div>
                        <div>
                            <span className={`user-status ${user.is_suspended ? 'suspended' : 'active'}`}>
                                {user.is_suspended ? '🚫 Suspendu' : '✅ Actif'}
                            </span>
                        </div>
                        <div>Niveau {user.level}</div>
                        <div>
                            <button 
                                onClick={() => openUserModal(user)}
                                className="action-btn view-btn"
                            >
                                👁️ Voir
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showUserModal && selectedUser && (
                <UserModal 
                    user={selectedUser}
                    onClose={() => setShowUserModal(false)}
                    onAction={handleUserAction}
                    loading={actionLoading}
                />
            )}
        </div>
    );
};

// Modal pour les actions utilisateur
const UserModal = ({ user, onClose, onAction, loading }) => {
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordReset, setShowPasswordReset] = useState(false);

    return (
        <div className="modal-overlay">
            <div className="user-modal">
                <div className="modal-header">
                    <h3>👤 {user.name}</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                
                <div className="modal-content">
                    <div className="user-info">
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Type:</strong> {user.account_type}</p>
                        <p><strong>Statut:</strong> 
                            <span className={`user-status ${user.is_suspended ? 'suspended' : 'active'}`}>
                                {user.is_suspended ? '🚫 Suspendu' : '✅ Actif'}
                            </span>
                        </p>
                        <p><strong>Niveau:</strong> {user.level}</p>
                        <p><strong>Fragments:</strong> {user.fragments}</p>
                        <p><strong>Créé le:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="modal-actions">
                        <button 
                            onClick={() => onAction(user.id, 'toggle-status', { 
                                action: user.is_suspended ? 'activate' : 'suspend',
                                reason: 'Action admin'
                            })}
                            className={`action-btn ${user.is_suspended ? 'activate-btn' : 'suspend-btn'}`}
                            disabled={loading}
                        >
                            {user.is_suspended ? '✅ Réactiver' : '🚫 Suspendre'}
                        </button>
                        
                        <button 
                            onClick={() => setShowPasswordReset(!showPasswordReset)}
                            className="action-btn reset-btn"
                        >
                            🔑 Réinitialiser mot de passe
                        </button>
                        
                        {user.account_type !== 'admin' && (
                            <button 
                                onClick={() => onAction(user.id, 'promote')}
                                className="action-btn promote-btn"
                                disabled={loading}
                            >
                                ⬆️ Promouvoir Admin
                            </button>
                        )}
                    </div>
                    
                    {showPasswordReset && (
                        <div className="password-reset">
                            <input
                                type="password"
                                placeholder="Nouveau mot de passe"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                                onClick={() => {
                                    if (newPassword.length >= 6) {
                                        onAction(user.id, 'reset-password', { newPassword });
                                        setNewPassword('');
                                        setShowPasswordReset(false);
                                    }
                                }}
                                className="action-btn confirm-btn"
                                disabled={loading || newPassword.length < 6}
                            >
                                Confirmer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
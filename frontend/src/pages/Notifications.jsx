import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Notifications.css';
import {
  FaUsers,
  FaEnvelope,
  FaUser,
  FaGem,
  FaCrown,
  FaBell,
  FaCheckCircle,
  FaHeart,
  FaComment,
  FaSpinner
} from 'react-icons/fa';

function Notifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const markAsRead = async (id) => {
    if (!token) return;
    
    try {
      await axios.put(`http://localhost:5000/api/notifications/read/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    
    try {
      await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));  
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'follow': return <FaUsers />;
      case 'message': return <FaEnvelope />;
      case 'comment': return <FaComment />;
      case 'like': return <FaHeart />;
      case 'achievement': return <FaCrown />;
      default: return <FaBell />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-loading">
          <FaSpinner className="spinner" />
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1 className="notifications-title">Mes Notifications</h1>
        <div className="notifications-stats">
          <div className="notifications-count">
            <FaBell />
            Total: {notifications.length}
            {unreadCount > 0 && (
              <span className="notifications-count-badge">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={markAllAsRead}>
              <FaCheckCircle />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {notifications.length > 0 ? (
        <ul className="notifications-list">
          {notifications.map(n => (
            <li key={n.id} className={`notification-item ${n.is_read === 0 ? 'unread' : ''}`}>
              <div className="notification-content">
                <div className={`notification-icon type-${n.type}`}>
                  {getNotificationIcon(n.type)}
                </div>
                <div className="notification-details">
                  <h3 className="notification-title">{n.title}</h3>
                  <p className="notification-message">{n.content}</p>
                  <div className="notification-meta">
                    <span className="notification-time">
                      {formatTimeAgo(n.created_at)}
                    </span>
                    {n.is_read === 0 && (
                      <div className="notification-actions">
                        <button className="read-btn" onClick={() => markAsRead(n.id)}>
                          Marquer comme lu
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="notifications-empty">
          <div className="notifications-empty-icon">
            <FaBell />
          </div>
          <h2 className="notifications-empty-title">Aucune notification</h2>
          <p className="notifications-empty-message">
            Vous n'avez pas encore de notifications. Revenez plus tard pour voir les nouvelles activités !
          </p>
        </div>
      )}
    </div>
  );
}

export default Notifications;

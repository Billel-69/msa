import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/connexion');
            return;
        }

        axios.get('http://localhost:5000/api/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(res => setProfile(res.data))
            .catch(err => {
                console.error(err);
                localStorage.removeItem('token');
                navigate('/connexion');
            });
    }, [navigate]);

    if (!profile) return <div>Chargement du profil...</div>;

    return (
        <div className="profile-page">
            <div className="profile-content">
                <div className="profile-top">
                    <img src={require('../asset/pdp.jpg')} alt="Avatar" className="avatar" />
                    <div className="info">
                        <h1>{profile.name}</h1>
                        <p className="rank">🔥 Rang {profile.rank}</p>
                        <p className="title">Maitre du Fragment</p>
                    </div>
                </div>

                <div className="profile-stats">
                    <h2>Niveau {profile.level}</h2>
                    <div className="progress-bar">
                        <div className="filled" style={{ width: `${profile.level * 10}%` }}></div>
                    </div>
                    <div className="stats-row">
                        <div className="stat">
                            <p className="value">{profile.quests_completed}</p>
                            <p>Quêtes Terminées</p>
                        </div>
                        <div className="stat">
                            <p className="value">{profile.fragments}/15</p>
                            <p>Fragments Débloqués</p>
                        </div>
                        <div className="stat">
                            <p className="value">{profile.badges}</p>
                            <p>Badges Obtenus</p>
                        </div>
                    </div>
                </div>

                <div className="profile-bottom">
                    <div className="style-box">
                        <h3>Style</h3>
                        <div className="style-card">
                            <img src={require('../asset/pdp.jpg')} alt="Mage" />
                            <p>{profile.style}</p>
                            <span>Ton style monte de niveau !</span>
                        </div>
                    </div>

                    <div className="journal-box">
                        <h3>Équipement & Journal</h3>
                        <div className="journal-entry">
                            <span className="tag">Nouveau</span>
                            <p className="title">L'Étoile Mathématiques</p>
                            <p className="time">il y a 5 jours</p>
                        </div>
                        <div className="journal-entry">
                            <p className="title">🧠 Cyber Enigma</p>
                            <p className="time">il y a 5 jours</p>
                        </div>
                        <div className="journal-entry">
                            <p className="title">🧠 Cyber Enigma</p>
                            <p className="time">il y a 7 jours</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;

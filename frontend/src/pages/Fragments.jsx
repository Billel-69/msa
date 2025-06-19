import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Fragments.css';

function Fragments() {
    const { user } = useAuth();
    const [selectedFragment, setSelectedFragment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Données fictives pour les fragments (true = débloqué, false = verrouillé)
    const fragments = [
        { id: 1, unlocked: true, name: "Fragment de Feu", description: "Maîtrise des éléments ardents", image: "🔥" },
        { id: 2, unlocked: true, name: "Fragment d'Eau", description: "Contrôle des flots mystiques", image: "💧" },
        { id: 3, unlocked: true, name: "Fragment de Terre", description: "Force tellurique ancienne", image: "🌍" },
        { id: 4, unlocked: true, name: "Fragment d'Air", description: "Maîtrise des vents", image: "🌪️" },
        { id: 5, unlocked: true, name: "Fragment de Lumière", description: "Éclat de la sagesse", image: "✨" },
        { id: 6, unlocked: false, name: "Fragment d'Ombre", description: "Mystères des ténèbres", image: "🌙" },
        { id: 7, unlocked: false, name: "Fragment de Glace", description: "Cristaux éternels", image: "❄️" },
        { id: 8, unlocked: false, name: "Fragment de Foudre", description: "Puissance électrique", image: "⚡" },
        { id: 9, unlocked: false, name: "Fragment de Nature", description: "Essence vivante", image: "🌱" },
        { id: 10, unlocked: false, name: "Fragment de Métal", description: "Résistance inébranlable", image: "⚒️" },
        { id: 11, unlocked: false, name: "Fragment de Temps", description: "Contrôle temporel", image: "⏳" },
        { id: 12, unlocked: false, name: "Fragment d'Espace", description: "Manipulation dimensionnelle", image: "🌌" }
    ];

    const unlockedCount = fragments.filter(f => f.unlocked).length;
    const totalCount = fragments.length;
    const progressPercentage = (unlockedCount / totalCount) * 100;

    const handleFragmentClick = (fragment) => {
        if (fragment.unlocked) {
            setSelectedFragment(fragment);
            setShowModal(true);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedFragment(null);
    };

    useEffect(() => {
        // Animation d'apparition progressive des fragments
        const fragmentElements = document.querySelectorAll('.fragment');
        fragmentElements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('fragment-appear');
        });
    }, []);

    return (
        <div className="fragments">
            <h1>Fragments Mystiques</h1>

            <div className="fragments-description">
                <p>
                    Collectionnez les fragments mystiques pour débloquer de nouveaux pouvoirs et
                    accéder aux secrets les plus profonds du Kaizenverse. Chaque fragment représente
                    une maîtrise unique qui vous rapprochera de la sagesse ultime.
                </p>
            </div>

            <div className="fragments-progress">
                <div className="progress-text">
                    Progression: {unlockedCount}/{totalCount} Fragments
                </div>
                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            <div className="fragments-grid">
                {fragments.map((fragment) => (
                    <div
                        key={fragment.id}
                        className={`fragment ${!fragment.unlocked ? 'locked' : ''}`}
                        onClick={() => handleFragmentClick(fragment)}
                        title={fragment.unlocked ? fragment.name : "Fragment verrouillé"}
                    >
                        {fragment.unlocked ? (
                            <span style={{ fontSize: '32px' }}>{fragment.image}</span>
                        ) : null}
                    </div>
                ))}
            </div>

            <div className="fragments-stats">
                <h3 style={{ color: '#00e0ff', marginBottom: '20px' }}>Statistiques</h3>
                <div className="stats-grid">
                    <div className="stat-item">
                        <div className="stat-value">{unlockedCount}</div>
                        <div className="stat-label">Débloqués</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{totalCount - unlockedCount}</div>
                        <div className="stat-label">Restants</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{Math.round(progressPercentage)}%</div>
                        <div className="stat-label">Progression</div>
                    </div>
                </div>
            </div>

            {/* Modal de fragment */}
            {showModal && selectedFragment && (
                <div className="fragment-modal active" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-fragment">
                            <span style={{ fontSize: '48px' }}>{selectedFragment.image}</span>
                        </div>
                        <h2 style={{ color: '#00e0ff', marginBottom: '10px' }}>
                            {selectedFragment.name}
                        </h2>
                        <p style={{ color: '#aaa', marginBottom: '20px' }}>
                            {selectedFragment.description}
                        </p>
                        <div style={{
                            background: 'rgba(0, 224, 255, 0.1)',
                            padding: '15px',
                            borderRadius: '10px',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{ color: '#ff8c00', margin: '0 0 10px 0' }}>Bonus actif:</h4>
                            <ul style={{ color: '#fff', margin: 0, paddingLeft: '20px' }}>
                                <li>+10 XP par quête complétée</li>
                                <li>Accès aux défis spéciaux</li>
                                <li>Nouvelle apparence débloquée</li>
                            </ul>
                        </div>
                        <button
                            onClick={closeModal}
                            style={{
                                background: 'linear-gradient(45deg, #00e0ff, #0099cc)',
                                color: 'white',
                                border: 'none',
                                padding: '10px 25px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Fragments;
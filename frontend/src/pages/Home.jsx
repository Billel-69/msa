// src/pages/Home.js
import React from 'react';
import './Home.css';
import { FaLock, FaHammer } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function Home() {
    const categories = [
        'Mathématiques', 'Français', 'Histoire', 'Anglais', 'Espagnol', 'Multiverse',
        'Sciences', 'Géographie', 'Musique', 'Art', 'Philosophie', 'Technologie'
    ];
    const fragments = new Array(15).fill(false);
    fragments[14] = true;

    return (
        <div className="home">


            <section className="hero-section" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div className="hero-image" style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
                    <img src={require('../asset/mage.png')} alt="Mini-jeux" style={{maxWidth: '350px', width: '100%', height: 'auto', borderRadius: '16px', marginRight: '40px'}} />
                </div>
                <div className="hero-content" style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'}}>
                    <h1>AMÉLIORES TES CONNAISSANCES</h1>
                    <button className="cta-button">ENTRE DANS TA QUÊTE</button>
                </div>
            </section>            <section className="categories">
                <div className="scroll-container">
                    {categories.map((cat, index) => {
                        const getIcon = (category) => {
                            const icons = {
                                'Mathématiques': '🔢',
                                'Français': '📚',
                                'Histoire': '🏛️',
                                'Anglais': '🇬🇧',
                                'Espagnol': '🇪🇸',
                                'Multiverse': '🌌',
                                'Sciences': '🔬',
                                'Géographie': '🗺️',
                                'Musique': '🎵',
                                'Art': '🎨',
                                'Philosophie': '🤔',
                                'Technologie': '💻'
                            };
                            return icons[category] || '🎮';
                        };
                        
                        return (
                            <div key={index} className="category-card">
                                <div className="icon-placeholder">{getIcon(cat)}</div>
                                <p>{cat}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="fragments">
                {fragments.map((active, index) => (
                    <div key={index} className={`fragment ${active ? 'unlocked' : ''}`}>
                        {active ? <FaHammer /> : <FaLock />}
                    </div>
                ))}
                <span className="fragment-count">1/15</span>
            </section>            <section className="mini-games">
                <div className="game-card">
                    <div className="game-thumbnail">
                        <img src={require('../asset/minijeux.jpg')} alt="Flash Cards" style={{width: '100%', height: 'auto', borderRadius: '8px'}} />
                    </div>
                    <div className="game-title">Cartes Mémoire</div>
                    <Link to="/flash-cards">
                        <button className="play-button">C'EST PARTI !</button>
                    </Link>
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i + 1} className="game-card">
                        <div className="game-thumbnail">
                            <img src={require('../asset/minijeux.jpg')} alt="Mini-jeux" style={{width: '100%', height: 'auto', borderRadius: '8px'}} />
                        </div>
                        <div className="game-title">Jeu à venir</div>
                        <button className="play-button disabled" disabled>BIENTÔT</button>
                    </div>
                ))}
            </section>
        </div>
    );
}

export default Home;


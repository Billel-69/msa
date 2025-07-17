import React from 'react';
import './Worlds.css';

const categories = [
    { label: 'Mathématiques', icon: require('../asset/m10.png') },
    { label: 'Physique', icon: require('../asset/m9.png') },
    { label: 'SVT', icon: require('../asset/m8.png') },
    { label: 'SES', icon: require('../asset/m7.png') },
    { label: 'Philosophie', icon: require('../asset/m6.png') },
    { label: 'Espagnol', icon: require('../asset/m5.png') },
    { label: 'Histoire', icon: require('../asset/m4.png') },
    { label: 'Anglais', icon: require('../asset/m3.png') },
    { label: 'Français', icon: require('../asset/m2.png') }
];

function Worlds() {
    return (
        <div className="worlds-page">


            <section className="hero-section">
                <div className="hero-text">
                    <h1>EXPLORE LES</h1>
                    <h1>DIFFÉRENTS MONDES</h1>
                </div>
                <div className="hero-image">
                    <img src={require('../asset/mage.png')} alt="Mage" />
                </div>
            </section>

            <section className="worlds-grid">
                {categories.map((cat, index) => (
                    <div key={index} className="world-card">
                        <img src={cat.icon} alt={cat.label} />
                        <p>{cat.label}</p>
                    </div>
                ))}
            </section>
        </div>
    );
}

export default Worlds;
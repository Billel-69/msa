// src/pages/Fragments.js
import React from 'react';
import './Fragments.css';

function Fragments() {
    // Données fictives pour les fragments (true = débloqué, false = verrouillé)
    const fragments = [
        true, true, true, true,
        true, false, false, false,
        false, false, false, false
    ];

    return (
        <div className="fragments">
            <h1>Fragments</h1>
            <div className="fragments-grid">
                {fragments.map((unlocked, index) => (
                    unlocked ? (
                        <img
                            key={index}
                            src=""
                            alt={`Fragment ${index + 1} débloqué`}
                            className="fragment unlocked"
                        />
                    ) : (
                        <img
                            key={index}
                            src=""
                            alt={`Fragment ${index + 1} verrouillé`}
                            className="fragment locked"
                        />
                    )
                ))}
            </div>
        </div>
    );
}

export default Fragments;

// src/components/ProgressModule.js
import React from 'react';
import './ProgressModule.css';

function ProgressModule({ title, progress }) {
    return (
        <div className="module-card">
            <h3>{title}</h3>
            <div className="progress-bar">
                <div className="progress" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="progress-text">{progress}% complété</p>
        </div>
    );
}

export default ProgressModule;

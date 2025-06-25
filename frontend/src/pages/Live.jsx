import React from 'react';
import './Live.css'; // Import the CSS file
import mageImg from '../asset/mage.png';


function App() {
    return (
        <div className="app-container">


            <main className="main-content">
                <div className="live-stream-section">
                    <div className="live-indicator">EN DIRECT</div>
                    <div className="wizard-avatar">
                        {/* This would typically be an <img> tag for the wizard image */}
                        <img src={mageImg} alt="Wizard"/></div>
                    <div className="xp-display">120 XP</div>
                    <button className="quit-button">QUITTER</button>
                </div>

                <div className="chat-section">
                    <div className="chat-header">CHAT</div>                    <div className="chat-messages">
                        <p><strong>🧙‍♂️ Maître Kaizenverse:</strong> Bienvenue dans la session magique d'aujourd'hui !</p>
                        <p><strong>✨ Emma:</strong> Prêt pour les nouveaux défis !</p>
                        <p><strong>🎯 Lucas:</strong> J'ai hâte de voir les nouvelles quêtes</p>
                        <p><strong>🌟 Sophie:</strong> Merci pour les conseils de la dernière fois</p>
                        <p><strong>🔥 Alex:</strong> Cette semaine j'ai progressé en mathématiques !</p>
                        <p><strong>💫 Mia:</strong> Les flash cards m'aident beaucoup</p>
                        {/* Messages en temps réel apparaîtront ici */}
                    </div>
                    <div className="chat-input-container">
                        <input type="text" placeholder="Envoyer un message ..." className="chat-input" />
                        <button className="send-button">
                            {/* You might use an icon here for the send button */}
                            &gt; {/* Simple arrow for now */}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
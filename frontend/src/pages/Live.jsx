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
                    <div className="chat-header">CHAT</div>
                    <div className="chat-messages">
                        {/* Chat messages would go here, dynamically rendered */}
                        {/* Example: */}
                        {/* <p>User1: Hello!</p> */}
                        {/* <p>User2: Hi there!</p> */}
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
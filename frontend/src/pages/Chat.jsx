import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Chat.css';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import MathJaxProcessor from '../components/MathJaxProcessor';

// Icônes SVG pour les éléments UI
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
  </svg>
);

const AssistantIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79 2.73 2.71 7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58 3.51-3.47 9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z"></path>
  </svg>
);

const ThumbUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"></path>
  </svg>
);

const ThumbDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"></path>
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
  </svg>
);

// Suggestions de questions - Personnalisez selon votre besoin éducatif
const questionSuggestions = [
  "Comment fonctionne la photosynthèse ?",
  "Explique le théorème de Pythagore",
  "Qui était Marie Curie ?",
  "Qu'est-ce que le réchauffement climatique ?"
];

// Fonction pour convertir le texte avec les formules LaTeX
const renderMessageContent = (content) => {
  // Diviser le texte en segments: texte normal et formules mathématiques
  const segments = [];
  let lastIndex = 0;
  
  // Rechercher les formules en bloc ($$...$$)
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  let blockMatch;
  
  while ((blockMatch = blockRegex.exec(content)) !== null) {
    // Ajouter le texte avant la formule
    if (blockMatch.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, blockMatch.index)
      });
    }
    
    // Ajouter la formule en bloc
    segments.push({
      type: 'block-math',
      content: blockMatch[1]
    });
    
    lastIndex = blockMatch.index + blockMatch[0].length;
  }
  
  // Rechercher les formules en ligne ($...$) dans le reste du texte
  const remaining = content.substring(lastIndex);
  const inlineRegex = /\$(.*?)\$/g;
  let inlineMatch;
  let inlineLastIndex = 0;
  
  while ((inlineMatch = inlineRegex.exec(remaining)) !== null) {
    // Ajouter le texte avant la formule
    if (inlineMatch.index > inlineLastIndex) {
      segments.push({
        type: 'text',
        content: remaining.substring(inlineLastIndex, inlineMatch.index)
      });
    }
    
    // Ajouter la formule en ligne
    segments.push({
      type: 'inline-math',
      content: inlineMatch[1]
    });
    
    inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
  }
  
  // Ajouter le texte restant
  if (inlineLastIndex < remaining.length) {
    segments.push({
      type: 'text',
      content: remaining.substring(inlineLastIndex)
    });
  }
  
  // Rendu des segments
  return segments.map((segment, index) => {
    if (segment.type === 'text') {
      return <span key={index}>{segment.content}</span>;
    } else if (segment.type === 'inline-math') {
      return <InlineMath key={index} math={segment.content} />;
    } else if (segment.type === 'block-math') {
      return <BlockMath key={index} math={segment.content} />;
    }
    return null;
  });
};

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();

  // Effet pour charger le threadId depuis localStorage au démarrage
  useEffect(() => {
    const savedThreadId = localStorage.getItem('sensai_thread_id');
    if (savedThreadId) {
      setThreadId(savedThreadId);
      setShowSuggestions(false); // Ne pas montrer les suggestions si conversation existante
    }
  }, []);

  // Défilement automatique vers le bas avec animation douce
  useEffect(() => {
    if (chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages, loading]);

  // Format horaire pour les messages
  const getFormattedTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Fonction pour copier le texte dans le presse-papiers
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Animation ou notification de succès pourrait être ajoutée ici
        console.log("Texte copié !");
      },
      (err) => {
        console.error("Erreur lors de la copie :", err);
      }
    );
  };

  // Fonction pour envoyer un message
  const handleSend = async (messageText = input) => {
    if (!messageText.trim()) return;

    // Cacher les suggestions après le premier message
    setShowSuggestions(false);

    // Ajouter le message de l'utilisateur à l'interface avec horodatage
    const userMessage = { 
      role: 'user', 
      content: messageText,
      time: getFormattedTime()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          thread_id: threadId,
          // Options additionnelles
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec l\'IA');
      }

      const data = await response.json();
      
      // Mettre à jour et sauvegarder le threadId
      if (data.thread_id) {
        setThreadId(data.thread_id);
        localStorage.setItem('sensai_thread_id', data.thread_id);
      }

      // Ajouter la réponse de l'IA avec horodatage
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: data.answer,
          time: getFormattedTime() 
        }
      ]);
    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
          time: getFormattedTime() 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'appui sur Entrée (avec Shift+Entrée pour nouvelle ligne)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Ajuster la hauteur du textarea en fonction du contenu
  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = '54px';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Fonction pour sélectionner une suggestion
  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <BackIcon /> Retour
        </button>
        <h1>SENS AI - Ton assistant d'apprentissage</h1>
      </div>

      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-logo">
              <div className="sensai-avatar-large"></div>
            </div>
            <h2>Bienvenue sur SENS AI</h2>
            <p>Je suis ton assistant pour t'aider dans ton apprentissage.</p>
            <p>Pose-moi n'importe quelle question sur tes cours !</p>
            
            {showSuggestions && (
              <div className="suggestions">
                {questionSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                {msg.role === 'user' ? (
                  <div className="user-avatar">
                    <UserIcon />
                  </div>
                ) : (
                  <div className="sensai-avatar">
                    <AssistantIcon />
                  </div>
                )}
                <div className="message-bubble">
                  <div className="message-content">
                    <MathJaxProcessor text={msg.content} />
                    <div className="message-time">{msg.time}</div>
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="message-actions">
                      <button 
                        className="message-action-button" 
                        title="Copier"
                        onClick={() => copyToClipboard(msg.content)}
                      >
                        <CopyIcon />
                      </button>
                      <button 
                        className="message-action-button"
                        title="Utile"
                      >
                        <ThumbUpIcon />
                      </button>
                      <button 
                        className="message-action-button"
                        title="Pas utile"
                      >
                        <ThumbDownIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message assistant-message">
                <div className="sensai-avatar">
                  <AssistantIcon />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} style={{ height: '10px' }} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={input}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Pose ta question ici..."
          />
        </div>
        <button 
          className="send-button" 
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          aria-label="Envoyer"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default Chat;
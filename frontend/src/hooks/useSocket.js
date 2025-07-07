// Fichier: src/hooks/useSocket.js
// Version corrigée pour éviter les reconnexions multiples

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
    const { token, user } = useAuth();

    // États
    const [isConnected, setIsConnected] = useState(false);

    // Refs pour éviter les reconnexions
    const socketRef = useRef(null);
    const isConnectingRef = useRef(false);
    const listenersRef = useRef(new Map());

    // Configuration
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Connexion unique
    useEffect(() => {
        if (!token || !user || socketRef.current || isConnectingRef.current) {
            return;
        }

        connectSocket();

        return () => {
            disconnectSocket();
        };
    }, [token, user?.id]); // Dépendances stables

    const connectSocket = useCallback(() => {
        if (isConnectingRef.current || socketRef.current) {
            return;
        }

        try {
            isConnectingRef.current = true;

            console.log('🔌 Tentative de connexion Socket.io...');
            console.log('URL:', API_URL);
            console.log('Token présent:', !!token);

            const socket = io(API_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                timeout: 10000,
                retries: 3
            });

            socket.on('connect', () => {
                console.log('✅ Socket connecté:', socket.id);
                setIsConnected(true);
                isConnectingRef.current = false;
            });

            socket.on('disconnect', (reason) => {
                console.log('❌ Socket déconnecté:', reason);
                setIsConnected(false);

                // Ne pas reconnecter automatiquement sur certaines raisons
                if (reason === 'io client disconnect' || reason === 'transport close') {
                    socketRef.current = null;
                }
            });

            socket.on('connect_error', (error) => {
                console.error('❌ Erreur de connexion Socket:', error);
                setIsConnected(false);
                isConnectingRef.current = false;
            });

            socket.on('error', (error) => {
                console.error('❌ Erreur Socket générale:', error);

                // Notifier les listeners d'erreur
                const errorListeners = listenersRef.current.get('error') || [];
                errorListeners.forEach(callback => {
                    try {
                        callback(error);
                    } catch (err) {
                        console.error('Erreur dans callback d\'erreur:', err);
                    }
                });
            });

            socketRef.current = socket;

        } catch (error) {
            console.error('❌ Erreur création socket:', error);
            isConnectingRef.current = false;
        }
    }, [API_URL, token]);

    const disconnectSocket = useCallback(() => {
        console.log('🔌 Déconnexion Socket...');

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        setIsConnected(false);
        isConnectingRef.current = false;
        listenersRef.current.clear();
    }, []);

    // Rejoindre une session
    const joinSession = useCallback((sessionId) => {
        if (!socketRef.current || !isConnected) {
            console.warn('⚠️ Socket non connecté pour joinSession');
            return;
        }

        console.log('📝 Rejoindre session Socket:', sessionId);
        socketRef.current.emit('join-live-session', { sessionId });
    }, [isConnected]);

    // Quitter une session
    const leaveSession = useCallback((sessionId) => {
        if (!socketRef.current) {
            return;
        }

        console.log('👋 Quitter session Socket:', sessionId);
        socketRef.current.emit('leave-live-session', { sessionId });
    }, []);

    // Envoyer un message
    const sendMessage = useCallback((sessionId, message) => {
        if (!socketRef.current || !isConnected) {
            console.warn('⚠️ Socket non connecté pour sendMessage');
            return;
        }

        if (!message || !message.trim()) {
            console.warn('⚠️ Message vide');
            return;
        }

        console.log('💬 Envoi message Socket');
        socketRef.current.emit('send-live-message', {
            sessionId,
            message: message.trim()
        });
    }, [isConnected]);

    // Écouter les nouveaux messages
    const onNewMessage = useCallback((callback) => {
        if (!socketRef.current) {
            return () => {};
        }

        const handleNewMessage = (data) => {
            try {
                callback(data);
            } catch (error) {
                console.error('Erreur dans callback onNewMessage:', error);
            }
        };

        // Ajouter le listener
        socketRef.current.on('new-live-message', handleNewMessage);

        // Stocker pour nettoyage
        const listeners = listenersRef.current.get('newMessage') || [];
        listeners.push(callback);
        listenersRef.current.set('newMessage', listeners);

        // Retourner fonction de nettoyage
        return () => {
            if (socketRef.current) {
                socketRef.current.off('new-live-message', handleNewMessage);
            }

            const currentListeners = listenersRef.current.get('newMessage') || [];
            const filteredListeners = currentListeners.filter(cb => cb !== callback);
            listenersRef.current.set('newMessage', filteredListeners);
        };
    }, []);

    // Écouter les événements de session
    const onJoinedSession = useCallback((callback) => {
        if (!socketRef.current) {
            return () => {};
        }

        const handleJoinedSession = (data) => {
            try {
                callback(data);
            } catch (error) {
                console.error('Erreur dans callback onJoinedSession:', error);
            }
        };

        socketRef.current.on('joined-live-session', handleJoinedSession);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('joined-live-session', handleJoinedSession);
            }
        };
    }, []);

    // Écouter les erreurs
    const onError = useCallback((callback) => {
        const listeners = listenersRef.current.get('error') || [];
        listeners.push(callback);
        listenersRef.current.set('error', listeners);

        return () => {
            const currentListeners = listenersRef.current.get('error') || [];
            const filteredListeners = currentListeners.filter(cb => cb !== callback);
            listenersRef.current.set('error', filteredListeners);
        };
    }, []);

    return {
        isConnected,
        joinSession,
        leaveSession,
        sendMessage,
        onNewMessage,
        onJoinedSession,
        onError,
        reconnect: connectSocket,
        disconnect: disconnectSocket
    };
};
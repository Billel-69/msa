// src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
    const socketRef = useRef(null);
    const { token } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) return;

        // Créer la connexion Socket.io
        socketRef.current = io('http://localhost:5000', {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling']
        });

        const socket = socketRef.current;

        // Événements de connexion
        socket.on('connect', () => {
            console.log('✅ Connecté au serveur Socket.io');
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', () => {
            console.log('❌ Déconnecté du serveur Socket.io');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Erreur de connexion Socket.io:', error);
            setError(error.message);
            setIsConnected(false);
        });

        socket.on('error', (error) => {
            console.error('❌ Erreur Socket.io:', error);
            setError(error.message);
        });

        // Nettoyage à la déconnexion
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [token]);

    // Fonctions pour interagir avec le socket
    const joinSession = (sessionId, password = null) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('join-live-session', { sessionId, password });
        }
    };

    const leaveSession = (sessionId) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('leave-session', { sessionId });
        }
    };

    const sendMessage = (sessionId, message, messageType = 'text') => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send-message', { sessionId, message, messageType });
        }
    };

    const onNewMessage = (callback) => {
        if (socketRef.current) {
            socketRef.current.on('new-message', callback);
            return () => socketRef.current.off('new-message', callback);
        }
    };

    const onJoinedSession = (callback) => {
        if (socketRef.current) {
            socketRef.current.on('joined-session', callback);
            return () => socketRef.current.off('joined-session', callback);
        }
    };

    const onError = (callback) => {
        if (socketRef.current) {
            socketRef.current.on('error', callback);
            return () => socketRef.current.off('error', callback);
        }
    };

    return {
        socket: socketRef.current,
        isConnected,
        error,
        joinSession,
        leaveSession,
        sendMessage,
        onNewMessage,
        onJoinedSession,
        onError
    };
};
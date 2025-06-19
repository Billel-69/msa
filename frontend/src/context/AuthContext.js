import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                console.log('AuthContext - Token stocké:', !!storedToken);
                console.log('AuthContext - User stocké:', !!storedUser);

                if (storedToken && storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    console.log('AuthContext - Utilisateur restauré:', parsedUser.username);

                    setToken(storedToken);
                    setUser(parsedUser);
                } else {
                    console.log('AuthContext - Aucune donnée d\'auth stockée');
                }
            } catch (error) {
                console.error('AuthContext - Erreur lors de la restauration:', error);
                // Nettoyer les données corrompues
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = (newToken, newUser) => {
        console.log('AuthContext - Login appelé avec:', {
            token: !!newToken,
            user: newUser?.username
        });

        try {
            // Vérifier que les données sont valides
            if (!newToken || !newUser) {
                throw new Error('Token ou utilisateur manquant');
            }

            // Sauvegarder dans localStorage
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            // Mettre à jour le state
            setToken(newToken);
            setUser(newUser);

            console.log('AuthContext - Login réussi pour:', newUser.username);
        } catch (error) {
            console.error('AuthContext - Erreur lors du login:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('AuthContext - Logout appelé');

        try {
            // Nettoyer localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Nettoyer le state
            setToken(null);
            setUser(null);

            console.log('AuthContext - Logout terminé');
        } catch (error) {
            console.error('AuthContext - Erreur lors du logout:', error);
        }
    };

    const value = {
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!(token && user)
    };

    // Log pour debug
    console.log('AuthContext - État actuel:', {
        hasUser: !!user,
        hasToken: !!token,
        loading,
        isAuthenticated: value.isAuthenticated
    });

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
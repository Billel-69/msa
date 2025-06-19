import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    console.log('PrivateRoute - Chemin:', location.pathname);
    console.log('PrivateRoute - Loading:', loading);
    console.log('PrivateRoute - Authenticated:', isAuthenticated);

    // Pendant le chargement de l'auth, afficher un loader
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p>Vérification de l'authentification...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Si pas authentifié, rediriger vers la connexion
    if (!isAuthenticated) {
        console.log('PrivateRoute - Redirection vers /connexion');
        return <Navigate to="/connexion" state={{ from: location }} replace />;
    }

    // Si authentifié, afficher le contenu
    console.log('PrivateRoute - Accès autorisé');
    return children;
};

export default PrivateRoute;
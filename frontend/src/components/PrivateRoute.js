import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) {
        return <div>Chargement...</div>; // pendant que ça lit le localStorage
    }

    if (!token) {
        return <Navigate to="/connexion" />;
    }

    return children;
};

export default PrivateRoute;

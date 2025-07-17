import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';

// Import the comprehensive design system
import './styles/DesignSystem.css';
import './styles/Components.css';
import './styles/Accessibility.css';
import './styles/Responsive.css';
import Home from './pages/Home';
import Worlds from './pages/Worlds';
import Profile from './pages/Profile';
import Fragments from './pages/Fragments';
import Login from './pages/Login';
import Subscriptions from './pages/Subscriptions';
import Register from "./pages/Register";

// IMPORTANT: Nouveau composant pour les sessions live
import LiveSession from "./pages/LiveSession"; // ← Nouveau avec chat temps réel
import LiveMenu from "./pages/LiveMenu"; // ← Menu principal

import PrivateRoute from './components/PrivateRoute';
import EditProfile from "./pages/EditProfile";

// Import des nouvelles pages réseau social
import Feed from "./pages/Feed";
import PostDetails from "./pages/PostDetails";
import ProfilePublic from "./pages/ProfilePublic";
import FollowersList from "./pages/FollowersList";
import FollowingList from "./pages/FollowingList";
import CreatePost from "./pages/CreatePost";
import ParentSetup from "./pages/ParentSetup";
import ParentDashboard from "./pages/ParentDashboard";

// Import des pages Messages
import Messages from "./pages/Messages";

// Import des pages Mini-Jeux
import MiniGames from "./pages/MiniGames";
import GameDetail from "./pages/GameDetail";

// Import du Chat IA
import Chat from "./pages/Chat";
import Notifications from './pages/Notifications';

// Import Admin Dashboard
import AdminDashboard from './pages/AdminDashboard';

function App() {
    const location = useLocation();

    // Debug: afficher la route actuelle
    console.log('🛣️ Route actuelle:', location.pathname);

    return (
        <>
            {location.pathname !== '/connexion' && <NavBar />}

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/mondes" element={<Worlds />} />

                {/* MENU LIVE PRINCIPAL */}
                <Route path="/live" element={
                    <PrivateRoute>
                        <LiveMenu />
                    </PrivateRoute>
                } />

                {/* SESSION LIVE INDIVIDUELLE - NOUVEAU COMPOSANT */}
                <Route path="/live/session/:sessionId" element={
                    <PrivateRoute>
                        <LiveSession />
                    </PrivateRoute>
                } />

                {/* Routes protégées */}
                <Route path="/profil" element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                } />
                <Route path="/fragments" element={
                    <PrivateRoute>
                        <Fragments />
                    </PrivateRoute>
                } />
                <Route path="/abonnements" element={
                    <PrivateRoute>
                        <Subscriptions />
                    </PrivateRoute>
                } />
                <Route path="/modifier-profil" element={
                    <PrivateRoute>
                        <EditProfile />
                    </PrivateRoute>
                } />

                {/* Routes Réseau Social */}
                <Route path="/reseau" element={
                    <PrivateRoute>
                        <Feed />
                    </PrivateRoute>
                } />
                <Route path="/post/:id" element={
                    <PrivateRoute>
                        <PostDetails />
                    </PrivateRoute>
                } />
                <Route path="/profil-public/:id" element={
                    <PrivateRoute>
                        <ProfilePublic />
                    </PrivateRoute>
                } />
                <Route path="/followers" element={
                    <PrivateRoute>
                        <FollowersList />
                    </PrivateRoute>
                } />
                <Route path="/following" element={
                    <PrivateRoute>
                        <FollowingList />
                    </PrivateRoute>
                } />
                <Route path="/create-post" element={
                    <PrivateRoute>
                        <CreatePost />
                    </PrivateRoute>
                } />

                {/* Routes Messages Privés */}
                <Route path="/messages" element={
                    <PrivateRoute>
                        <Messages />
                    </PrivateRoute>
                } />
                <Route path="/messages/:conversationId" element={
                    <PrivateRoute>
                        <Messages />
                    </PrivateRoute>
                } />

                {/* Routes Parent */}
                <Route path="/parent-setup" element={
                    <PrivateRoute>
                        <ParentSetup />
                    </PrivateRoute>
                } />
                <Route path="/parent-dashboard" element={
                    <PrivateRoute>
                        <ParentDashboard />
                    </PrivateRoute>
                } />

                {/* Routes Mini-Jeux */}
                <Route path="/mini-jeux" element={
                    <PrivateRoute>
                        <MiniGames />
                    </PrivateRoute>
                } />
                <Route path="/jeu/:id" element={
                    <PrivateRoute>
                        <GameDetail />
                    </PrivateRoute>
                } />

                {/* Route Chat IA */}
                <Route path="/chat" element={
                    <PrivateRoute>
                        <Chat />
                    </PrivateRoute>
                } />

                {/* Route Notifications */}
                <Route path="/notifications" element={
                    <PrivateRoute>
                        <Notifications />
                    </PrivateRoute>
                } />

                {/* Admin Dashboard - Route protégée pour les admins */}
                <Route path="/admin" element={
                    <PrivateRoute>
                        <AdminDashboard />
                    </PrivateRoute>
                } />

                {/* Routes publiques */}
                <Route path="/connexion" element={<Login />} />
                <Route path="/inscription" element={<Register />} />
            </Routes>
        </>
    );
}

export default App;
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Worlds from './pages/Worlds';
import Profile from './pages/Profile';
import Fragments from './pages/Fragments';
import Login from './pages/Login';
import Subscriptions from './pages/Subscriptions';
import Register from "./pages/Register";
import Live from "./pages/Live";
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
//ChatBot
import Chat from './pages/Chat';

// Import des pages Messages
import Messages from "./pages/Messages";

function App() {
    const location = useLocation();

    return (
        <>
            {location.pathname !== '/connexion' && <NavBar />}

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/mondes" element={<Worlds />} />
                <Route path="/live" element={<Live />} />

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

                {/* CHANGEMENT ICI : ParentSetup maintenant protégé */}
                <Route path="/parent-setup" element={
                    <PrivateRoute>
                        <ParentSetup />
                    </PrivateRoute>
                } />
               
                {/* ChatBot */}
                <Route path="/sensai" element={<Chat />} />

                {/* Nouveau : Dashboard parent */}
                <Route path="/parent-dashboard" element={
                    <PrivateRoute>
                        <ParentDashboard />
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
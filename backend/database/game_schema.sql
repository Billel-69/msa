-- ============================================================================
-- SCHÉMA DE BASE DE DONNÉES MINI-JEUX
-- ============================================================================
-- Tables MySQL pour la logique centrale des jeux et le suivi des utilisateurs
-- Système hybride MySQL/MongoDB pour performance et scalabilité
-- ============================================================================

-- ============================================================================
-- TABLE DES DÉFINITIONS DES MINI-JEUX
-- ============================================================================
-- Stocke les métadonnées et configurations des différents types de jeux
CREATE TABLE IF NOT EXISTS mini_games (
    id INT PRIMARY KEY AUTO_INCREMENT,                              -- Identifiant unique du jeu
    name VARCHAR(100) NOT NULL,                                      -- Nom du jeu (ex: "Flash Cards Mathématiques")
    type ENUM('flash_cards', 'branching_adventure') NOT NULL,        -- Type de jeu pour le routage des contrôleurs
    description TEXT,                                                -- Description détaillée du jeu
    target_cycle ENUM('cycle_3', 'cycle_4', 'terminal') NOT NULL,    -- Niveau scolaire ciblé
    subject VARCHAR(50) NOT NULL,                                    -- Matière (mathematiques, francais, histoire, etc.)
    difficulty_level ENUM('facile', 'moyen', 'difficile') NOT NULL, -- Niveau de difficulté
    theme VARCHAR(50),                                               -- Thème spécifique (optionnel)
    is_active BOOLEAN DEFAULT TRUE,                                  -- Permet de désactiver temporairement un jeu
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                 -- Date de création
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Dernière modification
);

-- ============================================================================
-- TABLE DES SESSIONS DE JEU
-- ============================================================================
-- Suivi léger des sessions individuelles de jeu pour statistiques
CREATE TABLE IF NOT EXISTS game_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,                              -- Identifiant unique de la session
    user_id INT NOT NULL,                                            -- Référence vers l'utilisateur
    game_id INT NOT NULL,                                            -- Référence vers le jeu joué
    session_type ENUM('flash_cards', 'branching_adventure') NOT NULL, -- Type de session pour validation
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                 -- Début de la session
    completed_at TIMESTAMP NULL,                                     -- Fin de la session (null si abandonnée)
    is_completed BOOLEAN DEFAULT FALSE,                             -- Statut de complétion
    final_score INT DEFAULT 0,                                      -- Score final obtenu
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,   -- Suppression en cascade
    FOREIGN KEY (game_id) REFERENCES mini_games(id) ON DELETE CASCADE,
    INDEX idx_user_sessions (user_id, started_at),                  -- Index pour performances utilisateur
    INDEX idx_game_sessions (game_id, started_at)                   -- Index pour performances par jeu
);

-- ============================================================================
-- TABLE DES RÉCOMPENSES ET XP
-- ============================================================================
-- Système de récompenses avec intégrité transactionnelle
CREATE TABLE IF NOT EXISTS game_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,                              -- Identifiant unique de la récompense
    user_id INT NOT NULL,                                            -- Référence vers l'utilisateur récompensé
    session_id INT,                                                  -- Référence vers la session (optionnelle)
    game_type ENUM('flash_cards', 'branching_adventure') NOT NULL,  -- Type de jeu pour catégorisation
    xp_earned INT DEFAULT 0,                                         -- Points d'expérience gagnés
    badge_earned VARCHAR(100),                                       -- Badge débloqué (optionnel)
    equipment_unlocked VARCHAR(100),                                 -- Équipement débloqué (optionnel)
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                  -- Date d'obtention de la récompense
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,   -- Suppression en cascade
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE SET NULL, -- Conservation des récompenses même si session supprimée
    INDEX idx_user_rewards (user_id, earned_at)                     -- Index pour performances par utilisateur
);

-- ============================================================================
-- TABLE DE RÉSUMÉ DU PROGRÈS UTILISATEUR
-- ============================================================================
-- Vue agrégée des performances globales par type de jeu
CREATE TABLE IF NOT EXISTS user_game_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,                              -- Identifiant unique du progrès
    user_id INT NOT NULL,                                            -- Référence vers l'utilisateur
    game_type ENUM('flash_cards', 'branching_adventure') NOT NULL,  -- Type de jeu suivi
    total_sessions INT DEFAULT 0,                                    -- Nombre total de sessions jouées
    total_xp INT DEFAULT 0,                                          -- Total des points d'expérience gagnés
    best_score INT DEFAULT 0,                                        -- Meilleur score obtenu
    current_level INT DEFAULT 1,                                     -- Niveau actuel calculé (basé sur XP)
    last_played TIMESTAMP NULL,                                      -- Dernière session jouée
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,   -- Suppression en cascade
    UNIQUE KEY unique_user_game (user_id, game_type)                -- Un seul enregistrement par utilisateur/type
);

-- ============================================================================
-- DONNÉES D'EXEMPLE
-- ============================================================================
-- Insertion des jeux Flash Cards de base pour démonstration
INSERT INTO mini_games (name, type, description, target_cycle, subject, difficulty_level, theme) VALUES
('Flash Cards Mathématiques', 'flash_cards', 'Révise tes tables et calculs rapidement', 'cycle_4', 'mathematics', 'moyen', 'default'),
('Flash Cards Français', 'flash_cards', 'Améliore ton vocabulaire et ta grammaire', 'cycle_4', 'french', 'moyen', 'default'),
('Flash Cards Histoire', 'flash_cards', 'Teste tes connaissances historiques', 'cycle_4', 'history', 'moyen', 'default'),
('Flash Cards Sciences', 'flash_cards', 'Révise tes notions scientifiques', 'cycle_4', 'sciences', 'moyen', 'default');

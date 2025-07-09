-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 09, 2025 at 12:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `msa`
--

-- --------------------------------------------------------

--
-- Table structure for table `achievements`
--

CREATE TABLE `achievements` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `condition_type` enum('posts_count','likes_received','comments_count','login_streak','quests_completed') NOT NULL,
  `condition_value` int(11) NOT NULL,
  `points` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `achievements`
--

INSERT INTO `achievements` (`id`, `name`, `description`, `icon`, `condition_type`, `condition_value`, `points`, `created_at`) VALUES
(1, 'Premier Post', 'Publier votre premier message', '🎉', 'posts_count', 1, 10, '2025-06-19 12:20:07'),
(2, 'Populaire', 'Recevoir 10 likes sur vos publications', '❤️', 'likes_received', 10, 25, '2025-06-19 12:20:07'),
(3, 'Commentateur', 'Laisser 5 commentaires', '💬', 'comments_count', 5, 15, '2025-06-19 12:20:07'),
(4, 'Assidu', 'Se connecter 7 jours d\'affilée', '🔥', 'login_streak', 7, 50, '2025-06-19 12:20:07'),
(5, 'Apprenant', 'Compléter 5 quêtes', '📚', 'quests_completed', 5, 30, '2025-06-19 12:20:07'),
(6, 'Expert', 'Compléter 25 quêtes', '🏆', 'quests_completed', 25, 100, '2025-06-19 12:20:07'),
(7, 'Influenceur', 'Recevoir 50 likes sur vos publications', '⭐', 'likes_received', 50, 75, '2025-06-19 12:20:07'),
(8, 'Bavard', 'Laisser 25 commentaires', '🗣️', 'comments_count', 25, 40, '2025-06-19 12:20:07'),
(9, 'Marathonien', 'Se connecter 30 jours d\'affilée', '🏃', 'login_streak', 30, 150, '2025-06-19 12:20:07'),
(10, 'Maître', 'Compléter 100 quêtes', '👑', 'quests_completed', 100, 300, '2025-06-19 12:20:07');

-- --------------------------------------------------------

--
-- Table structure for table `activity_log`
--

CREATE TABLE `activity_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_type` enum('login','quest_completed','post_created','comment_added','like_given') NOT NULL,
  `description` text DEFAULT NULL,
  `points_earned` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_conversations`
--

CREATE TABLE `ai_conversations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_id` varchar(100) DEFAULT uuid(),
  `message` text NOT NULL,
  `response` text NOT NULL,
  `model_used` enum('openai','rag_local') NOT NULL,
  `tokens_used` int(11) DEFAULT 0,
  `response_time_ms` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_usage_stats`
--

CREATE TABLE `ai_usage_stats` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `total_requests` int(11) DEFAULT 0,
  `openai_requests` int(11) DEFAULT 0,
  `rag_requests` int(11) DEFAULT 0,
  `total_tokens` bigint(20) DEFAULT 0,
  `unique_users` int(11) DEFAULT 0,
  `avg_response_time_ms` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `child_parent_links`
--

CREATE TABLE `child_parent_links` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `child_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `child_parent_links`
--

INSERT INTO `child_parent_links` (`id`, `parent_id`, `child_id`, `created_at`) VALUES
(1, 7, 8, '2025-06-19 11:04:29'),
(2, 1, 8, '2025-06-19 11:31:44'),
(3, 9, 10, '2025-06-19 11:35:01'),
(4, 9, 8, '2025-06-19 11:35:34'),
(5, 12, 13, '2025-06-23 13:33:11'),
(6, 12, 15, '2025-06-27 11:31:13');

-- --------------------------------------------------------

--
-- Table structure for table `child_reports`
--

CREATE TABLE `child_reports` (
  `id` int(11) NOT NULL,
  `child_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `report_date` date NOT NULL,
  `total_time_minutes` int(11) DEFAULT 0,
  `quests_completed` int(11) DEFAULT 0,
  `fragments_earned` int(11) DEFAULT 0,
  `subjects_studied` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`subjects_studied`)),
  `average_score` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `post_id`, `user_id`, `content`, `created_at`) VALUES
(2, 2, 13, 'tt', '2025-06-23 13:34:58'),
(3, 3, 13, 'comments133', '2025-06-25 15:08:32'),
(4, 3, 15, 'ttt', '2025-06-27 13:21:51'),
(5, 3, 15, 'd', '2025-07-02 07:23:55'),
(6, 4, 15, 'ddddd', '2025-07-08 16:02:39'),
(7, 4, 15, 'dzdzd', '2025-07-09 09:28:51');

-- --------------------------------------------------------

--
-- Table structure for table `comment_likes`
--

CREATE TABLE `comment_likes` (
  `id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `comment_likes`
--

INSERT INTO `comment_likes` (`id`, `comment_id`, `user_id`, `created_at`) VALUES
(2, 1, 11, '2025-06-20 13:50:27'),
(3, 2, 13, '2025-06-23 13:35:00'),
(4, 6, 15, '2025-07-08 16:02:42');

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` int(11) NOT NULL,
  `participant1_id` int(11) NOT NULL,
  `participant2_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id`, `participant1_id`, `participant2_id`, `created_at`, `updated_at`) VALUES
(1, 1, 11, '2025-06-20 12:58:27', '2025-06-23 10:29:34'),
(2, 12, 13, '2025-06-23 13:34:00', '2025-06-26 17:48:57'),
(3, 12, 15, '2025-06-27 13:28:33', '2025-07-08 14:31:22');

-- --------------------------------------------------------

--
-- Table structure for table `followers`
--

CREATE TABLE `followers` (
  `id` int(11) NOT NULL,
  `follower_id` int(11) NOT NULL,
  `followed_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `followers`
--

INSERT INTO `followers` (`id`, `follower_id`, `followed_id`, `created_at`) VALUES
(4, 13, 3, '2025-06-25 15:02:52'),
(5, 15, 3, '2025-07-02 10:11:31');

-- --------------------------------------------------------

--
-- Table structure for table `game_rewards`
--

CREATE TABLE `game_rewards` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `game_type` enum('flash_cards','branching_adventure') NOT NULL,
  `xp_earned` int(11) DEFAULT 0,
  `badge_earned` varchar(100) DEFAULT NULL,
  `equipment_unlocked` varchar(100) DEFAULT NULL,
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_sessions`
--

CREATE TABLE `game_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `session_type` enum('flash_cards','branching_adventure') NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `final_score` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `game_sessions`
--

INSERT INTO `game_sessions` (`id`, `user_id`, `game_id`, `session_type`, `started_at`, `completed_at`, `is_completed`, `final_score`) VALUES
(48, 15, 1, '', '2025-07-01 10:58:37', '2025-07-01 10:58:37', 1, 50),
(49, 15, 1, '', '2025-07-01 11:01:23', '2025-07-01 11:01:23', 1, 0),
(50, 15, 1, '', '2025-07-01 11:01:23', '2025-07-01 11:01:23', 1, 0),
(51, 15, 1, '', '2025-07-01 11:52:31', '2025-07-01 11:52:31', 1, 50),
(52, 15, 1, '', '2025-07-01 11:57:28', '2025-07-01 11:57:28', 1, 50),
(53, 15, 1, '', '2025-07-01 13:54:57', '2025-07-01 13:54:57', 1, 50),
(54, 15, 1, '', '2025-07-01 14:48:09', '2025-07-01 14:48:09', 1, 0),
(55, 15, 1, '', '2025-07-01 14:48:09', '2025-07-01 14:48:09', 1, 0),
(56, 15, 1, '', '2025-07-01 14:48:28', '2025-07-01 14:48:28', 1, 0),
(57, 15, 1, '', '2025-07-01 14:48:28', '2025-07-01 14:48:28', 1, 0),
(58, 15, 1, '', '2025-07-01 14:57:00', '2025-07-01 14:57:00', 1, 50),
(59, 15, 1, '', '2025-07-01 14:57:00', '2025-07-01 14:57:00', 1, 50),
(60, 15, 1, '', '2025-07-02 07:24:26', '2025-07-02 07:24:26', 1, 50),
(61, 15, 1, '', '2025-07-02 09:25:30', '2025-07-02 09:25:30', 1, 100),
(62, 15, 1, '', '2025-07-02 09:29:07', '2025-07-02 09:29:07', 1, 100),
(63, 15, 1, '', '2025-07-02 09:29:23', '2025-07-02 09:29:23', 1, 100),
(64, 15, 1, '', '2025-07-02 09:29:45', '2025-07-02 09:29:45', 1, 100),
(65, 15, 1, '', '2025-07-02 10:05:58', '2025-07-02 10:05:58', 1, 100),
(66, 15, 1, '', '2025-07-02 12:45:26', '2025-07-02 12:45:26', 1, 100),
(67, 15, 1, '', '2025-07-02 12:55:01', '2025-07-02 12:55:01', 1, 100),
(68, 15, 1, '', '2025-07-02 14:14:47', '2025-07-02 14:14:47', 1, 100),
(69, 15, 1, '', '2025-07-03 10:40:49', '2025-07-03 10:40:49', 1, 100),
(70, 15, 1, '', '2025-07-04 07:35:28', '2025-07-04 07:35:28', 1, 0),
(71, 15, 1, '', '2025-07-04 07:35:28', '2025-07-04 07:35:28', 1, 0),
(72, 15, 1, '', '2025-07-04 07:35:28', '2025-07-04 07:35:28', 1, 0),
(73, 15, 1, '', '2025-07-04 12:57:58', '2025-07-04 12:57:58', 1, 0),
(74, 15, 1, '', '2025-07-04 12:57:58', '2025-07-04 12:57:58', 1, 0),
(75, 15, 1, '', '2025-07-04 13:27:43', '2025-07-04 13:27:43', 1, 0),
(76, 15, 15, '', '2025-07-07 14:02:50', '2025-07-07 14:02:50', 1, 500),
(77, 15, 15, '', '2025-07-07 14:04:07', '2025-07-07 14:04:07', 1, 500),
(78, 15, 1, '', '2025-07-07 14:37:18', '2025-07-07 14:37:18', 1, 100),
(79, 15, 15, '', '2025-07-07 14:40:40', '2025-07-07 14:40:40', 1, 0),
(80, 15, 15, '', '2025-07-07 14:40:40', '2025-07-07 14:40:40', 1, 0),
(81, 15, 15, '', '2025-07-07 14:42:48', '2025-07-07 14:42:48', 1, 300),
(82, 15, 15, '', '2025-07-07 15:41:25', '2025-07-07 15:41:25', 1, 0),
(83, 15, 15, '', '2025-07-07 15:41:25', '2025-07-07 15:41:25', 1, 0),
(84, 15, 15, '', '2025-07-07 15:41:55', '2025-07-07 15:41:55', 1, 300),
(85, 15, 15, '', '2025-07-08 14:28:26', '2025-07-08 14:28:26', 1, 0),
(86, 15, 15, '', '2025-07-08 14:28:26', '2025-07-08 14:28:26', 1, 0),
(87, 15, 15, '', '2025-07-08 14:32:02', '2025-07-08 14:32:02', 1, 0),
(88, 15, 15, '', '2025-07-08 14:32:02', '2025-07-08 14:32:02', 1, 0),
(89, 15, 15, '', '2025-07-08 14:32:24', '2025-07-08 14:32:24', 1, 300),
(90, 15, 15, '', '2025-07-08 14:32:24', '2025-07-08 14:32:24', 1, 300),
(91, 15, 15, '', '2025-07-08 15:17:28', '2025-07-08 15:17:28', 1, 0),
(92, 15, 15, '', '2025-07-08 15:17:28', '2025-07-08 15:17:28', 1, 0),
(93, 15, 15, '', '2025-07-08 15:17:41', '2025-07-08 15:17:41', 1, 600),
(94, 15, 15, '', '2025-07-08 15:31:54', '2025-07-08 15:31:54', 1, 0),
(95, 15, 15, '', '2025-07-08 15:31:54', '2025-07-08 15:31:54', 1, 0),
(96, 15, 15, '', '2025-07-08 15:32:06', '2025-07-08 15:32:06', 1, 700),
(97, 15, 15, '', '2025-07-08 18:11:06', '2025-07-08 18:11:06', 1, 0),
(98, 15, 15, '', '2025-07-08 18:11:06', '2025-07-08 18:11:06', 1, 0),
(99, 15, 1, '', '2025-07-09 09:27:27', '2025-07-09 09:27:27', 1, 0),
(100, 15, 1, '', '2025-07-09 09:27:27', '2025-07-09 09:27:27', 1, 0),
(101, 15, 1, '', '2025-07-09 09:27:47', '2025-07-09 09:27:47', 1, 0),
(102, 15, 15, '', '2025-07-09 09:28:03', '2025-07-09 09:28:03', 1, 0),
(103, 15, 15, '', '2025-07-09 09:28:03', '2025-07-09 09:28:03', 1, 0),
(104, 15, 15, '', '2025-07-09 09:28:22', '2025-07-09 09:28:22', 1, 500),
(105, 15, 1, '', '2025-07-09 09:37:41', '2025-07-09 09:37:41', 1, 0),
(106, 15, 1, '', '2025-07-09 09:37:41', '2025-07-09 09:37:41', 1, 0),
(107, 15, 1, '', '2025-07-09 09:38:57', '2025-07-09 09:38:57', 1, 0),
(108, 15, 1, '', '2025-07-09 09:38:57', '2025-07-09 09:38:57', 1, 0),
(109, 15, 15, '', '2025-07-09 09:39:34', '2025-07-09 09:39:34', 1, 0),
(110, 15, 15, '', '2025-07-09 09:39:34', '2025-07-09 09:39:34', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `learning_sessions`
--

CREATE TABLE `learning_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `score` int(11) DEFAULT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `likes`
--

CREATE TABLE `likes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `likes`
--

INSERT INTO `likes` (`id`, `user_id`, `post_id`, `created_at`) VALUES
(1, 3, 1, '2025-06-18 14:09:21'),
(13, 1, 1, '2025-06-19 11:32:30'),
(12, 1, 2, '2025-06-19 11:32:29');

-- --------------------------------------------------------

--
-- Table structure for table `live_chat`
--

CREATE TABLE `live_chat` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `message_type` enum('text','system','emoji') DEFAULT 'text',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `live_chat`
--

INSERT INTO `live_chat` (`id`, `session_id`, `user_id`, `message`, `message_type`, `created_at`) VALUES
(1, 8, 12, 'salut', 'text', '2025-06-25 07:54:01'),
(2, 8, 1, 'comment tu va', 'text', '2025-06-25 07:54:13'),
(3, 8, 1, 'salut', 'text', '2025-06-25 08:14:42'),
(4, 9, 13, 'salut', 'text', '2025-06-25 12:09:53'),
(5, 10, 13, '🖥️ Le professeur partage son écran', 'text', '2025-06-26 07:40:08'),
(6, 10, 13, '🚫 Le professeur a arrêté le partage d\'écran', 'text', '2025-06-26 07:42:00'),
(7, 10, 13, 'cfrd', 'text', '2025-06-26 08:41:02'),
(8, 10, 13, 'vdf', 'text', '2025-06-26 08:41:05'),
(9, 10, 8, 'salut', 'text', '2025-06-26 08:45:31'),
(10, 10, 13, 'tu va bien', 'text', '2025-06-26 08:45:44'),
(11, 10, 13, '🖥️ Le professeur partage son écran', 'text', '2025-06-26 08:46:04'),
(12, 10, 13, '🚫 Le professeur a arrêté le partage d\'écran', 'text', '2025-06-26 08:46:49'),
(13, 10, 13, '🎤 Le professeur a activé son microphone', 'text', '2025-06-26 08:46:57'),
(14, 10, 13, '🔇 Le professeur a désactivé son microphone', 'text', '2025-06-26 08:47:37'),
(15, 11, 13, '📹 Le professeur a activé sa caméra', 'text', '2025-06-27 07:11:56'),
(16, 11, 13, '🎤 Le professeur a activé son microphone', 'text', '2025-06-27 07:12:33'),
(17, 11, 13, '📹❌ Le professeur a désactivé sa caméra', 'text', '2025-06-27 07:12:50'),
(18, 11, 13, '🔇 Le professeur a désactivé son microphone', 'text', '2025-06-27 07:12:53'),
(19, 12, 13, '🎤 Le professeur a activé son microphone', 'text', '2025-06-27 09:48:49'),
(20, 12, 13, '📹 Le professeur a activé sa caméra', 'text', '2025-06-27 09:48:53'),
(21, 12, 8, 'salut', 'text', '2025-06-27 09:49:57'),
(22, 12, 13, '📄 Le professeur a partagé un document: ChatGPT Image 26 juin 2025, 12_59_03.png', 'text', '2025-06-27 09:50:15'),
(23, 12, 13, '📹❌ Le professeur a désactivé sa caméra', 'text', '2025-06-27 09:51:10'),
(24, 12, 13, '🔇 Le professeur a désactivé son microphone', 'text', '2025-06-27 09:51:12'),
(25, 12, 13, '📹 Le professeur a activé sa caméra', 'text', '2025-06-27 09:51:17'),
(26, 12, 13, '🎤 Le professeur a activé son microphone', 'text', '2025-06-27 09:51:59'),
(27, 12, 13, '🔇 Le professeur a désactivé son microphone', 'text', '2025-06-27 09:52:17'),
(28, 12, 13, '🎤 Le professeur a activé son microphone', 'text', '2025-06-27 09:52:21'),
(29, 12, 13, '📹❌ Le professeur a désactivé sa caméra', 'text', '2025-06-27 09:52:27'),
(30, 12, 13, '📹 Le professeur a activé sa caméra', 'text', '2025-06-27 09:52:31'),
(31, 12, 13, '📹❌ Le professeur a désactivé sa caméra', 'text', '2025-06-27 09:57:47'),
(32, 14, 13, '🎥 La session a commencé !', 'text', '2025-06-30 06:43:52'),
(33, 15, 13, '🎥 La session a commencé !', 'text', '2025-06-30 07:02:25'),
(34, 13, 13, 'gfd', 'text', '2025-06-30 07:52:52'),
(35, 1, 8, 'bon', 'text', '2025-06-30 08:13:11'),
(36, 16, 1, '🎥 La session a commencé !', 'text', '2025-07-01 10:55:47'),
(37, 16, 1, '🎤 Le professeur a activé son microphone', 'text', '2025-07-01 10:55:53'),
(38, 16, 1, '📹 Le professeur a activé sa caméra', 'text', '2025-07-01 10:56:08'),
(39, 16, 1, '📹❌ Le professeur a désactivé sa caméra', 'text', '2025-07-01 10:56:47'),
(40, 17, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 08:12:20'),
(41, 17, 13, '🎥 La session a commencé !', 'system', '2025-07-02 08:12:27'),
(42, 17, 13, '🎥 La session a commencé !', 'text', '2025-07-02 08:12:27'),
(43, 17, 10, 'bonjour', 'text', '2025-07-02 08:12:34'),
(44, 17, 13, '🔚 La session est terminée', 'system', '2025-07-02 08:19:25'),
(45, 18, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 08:19:51'),
(46, 18, 13, '🎥 La session a commencé !', 'system', '2025-07-02 08:19:58'),
(47, 18, 13, '🎥 La session a commencé !', 'text', '2025-07-02 08:19:58'),
(48, 18, 13, 'salut', 'text', '2025-07-02 08:20:01'),
(49, 18, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 08:20:07'),
(50, 18, 10, 'salut', 'text', '2025-07-02 08:20:12'),
(51, 18, 13, 'salut', 'text', '2025-07-02 08:20:17'),
(52, 18, 13, '🎤 Le professeur a activé son microphone', 'text', '2025-07-02 08:20:27'),
(53, 18, 13, '📄 Le professeur a partagé un document: ChatGPT Image 26 juin 2025, 12_59_03.png', 'text', '2025-07-02 08:22:48'),
(54, 18, 13, '🖥️ Le professeur partage son écran', 'text', '2025-07-02 08:23:16'),
(55, 18, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 08:23:30'),
(56, 18, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 08:23:30'),
(57, 18, 13, '🚫 Le professeur a arrêté le partage d\'écran', 'text', '2025-07-02 08:23:44'),
(58, 18, 13, '🔇 Son coupé', 'text', '2025-07-02 08:23:49'),
(59, 18, 13, '📹 Le professeur a activé sa caméra', 'text', '2025-07-02 08:23:56'),
(60, 18, 13, '🔚 La session est terminée', 'system', '2025-07-02 08:25:04'),
(61, 19, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 08:50:48'),
(62, 19, 13, '🎥 La session a commencé !', 'system', '2025-07-02 08:51:08'),
(63, 19, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 08:51:23'),
(64, 19, 13, '🔚 La session est terminée', 'system', '2025-07-02 09:05:02'),
(65, 20, 13, '🎥 La session a commencé !', 'system', '2025-07-02 09:07:10'),
(66, 20, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 09:07:24'),
(67, 20, 13, '🔚 La session est terminée', 'system', '2025-07-02 09:07:47'),
(68, 1, 13, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 09:08:42'),
(69, 21, 13, '👋 Le professeur undefined a rejoint la session', 'system', '2025-07-02 09:08:52'),
(70, 22, 13, '🎥 La session a commencé !', 'system', '2025-07-02 09:27:22'),
(71, 22, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 09:27:38'),
(72, 23, 13, '🎥 La session a commencé !', 'system', '2025-07-02 09:36:33'),
(73, 23, 13, '🎤 Le professeur a activé son microphone', 'text', '2025-07-02 09:36:41'),
(74, 23, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-02 09:37:07'),
(75, 23, 13, '📹 Le professeur a activé sa caméra', 'text', '2025-07-02 09:37:31'),
(76, 23, 13, '📄 Le professeur partage le document : ChatGPT Image 26 juin 2025, 12_59_03.png', 'text', '2025-07-02 09:37:48'),
(77, 23, 13, '📹❌ Le professeur a désactivé sa caméra', 'text', '2025-07-02 09:40:30'),
(78, 23, 13, '🎤❌ Le professeur a désactivé son microphone', 'text', '2025-07-02 09:40:33'),
(79, 23, 13, '🔚 La session est terminée', 'system', '2025-07-03 07:01:34'),
(80, 22, 13, '🔚 La session est terminée', 'system', '2025-07-03 07:01:39'),
(81, 25, 13, '🎥 La session a commencé !', 'system', '2025-07-03 07:08:37'),
(82, 25, 13, '🎥 La session est maintenant en direct !', 'text', '2025-07-03 07:08:37'),
(83, 25, 13, '📹 Caméra activé', 'text', '2025-07-03 07:08:47'),
(84, 25, 13, '🎤 Microphone activé', 'text', '2025-07-03 07:08:52'),
(85, 25, 13, '🎤 Microphone désactivé', 'text', '2025-07-03 07:08:56'),
(86, 25, 13, '📹 Caméra désactivé', 'text', '2025-07-03 07:08:59'),
(87, 25, 13, 'salut', 'text', '2025-07-03 07:13:20'),
(88, 36, 13, '🎥 La session a commencé !', 'system', '2025-07-03 09:22:49'),
(89, 40, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-03 10:46:31'),
(90, 40, 13, '👋 Le professeur undefined a rejoint la session', 'system', '2025-07-03 10:46:49'),
(91, 42, 13, '🎥 La session a commencé !', 'system', '2025-07-03 12:22:15'),
(92, 42, 13, '🔚 La session est terminée', 'system', '2025-07-03 12:32:38'),
(93, 43, 13, '🎥 La session a commencé !', 'system', '2025-07-03 12:33:05'),
(94, 43, 13, '🔚 La session est terminée', 'system', '2025-07-03 12:33:33'),
(95, 44, 13, '🎥 La session a commencé !', 'system', '2025-07-03 12:35:17'),
(96, 44, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-03 12:35:26'),
(97, 44, 13, '🔚 La session est terminée', 'system', '2025-07-03 12:36:12'),
(98, 45, 13, '🎥 La session a commencé !', 'system', '2025-07-03 12:41:55'),
(99, 45, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-03 12:42:06'),
(100, 45, 13, '🔚 La session est terminée', 'system', '2025-07-03 12:42:41'),
(101, 46, 13, '🎥 La session a commencé !', 'system', '2025-07-03 12:46:16'),
(102, 46, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-03 12:47:45'),
(103, 46, 13, '🔚 La session est terminée', 'system', '2025-07-03 13:00:11'),
(104, 47, 13, '🎥 La session a commencé !', 'system', '2025-07-03 13:00:27'),
(105, 47, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-03 13:00:40'),
(106, 48, 13, '🎥 La session a commencé !', 'system', '2025-07-03 13:06:34'),
(107, 48, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-03 13:07:15'),
(108, 49, 13, '🎥 La session a commencé !', 'system', '2025-07-04 06:35:23'),
(109, 49, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-04 06:35:34'),
(110, 49, 13, '🔚 La session est terminée', 'system', '2025-07-04 07:00:14'),
(111, 50, 13, '🎥 La session a commencé !', 'system', '2025-07-04 07:00:44'),
(112, 50, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-04 07:00:57'),
(113, 51, 13, '🎥 La session a commencé !', 'system', '2025-07-04 07:30:47'),
(114, 51, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-04 07:30:54'),
(115, 52, 13, '🎥 La session a commencé !', 'system', '2025-07-06 12:56:03'),
(116, 52, 13, '🔚 La session est terminée', 'system', '2025-07-06 12:56:19'),
(117, 53, 13, '🎥 La session a commencé !', 'system', '2025-07-06 19:33:36'),
(118, 53, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-06 19:36:07'),
(119, 54, 13, '🎥 La session a commencé !', 'system', '2025-07-07 11:02:33'),
(120, 54, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-07 11:02:44'),
(121, 54, 13, '🔚 La session est terminée', 'system', '2025-07-07 11:03:26'),
(122, 55, 13, '🎥 La session a commencé !', 'system', '2025-07-08 08:06:49'),
(123, 55, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-08 08:08:40'),
(124, 55, 13, '🔚 La session est terminée', 'system', '2025-07-08 08:09:22'),
(125, 56, 13, '🎥 La session a commencé !', 'system', '2025-07-08 09:06:12'),
(126, 57, 13, '🎥 La session a commencé !', 'system', '2025-07-08 09:08:38'),
(127, 57, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-08 09:10:29'),
(128, 57, 13, '🔚 La session est terminée', 'system', '2025-07-08 09:13:47'),
(129, 59, 13, '🎥 La session a commencé !', 'system', '2025-07-08 09:43:08'),
(130, 62, 13, '🎥 La session a commencé !', 'system', '2025-07-09 07:42:06'),
(131, 62, 10, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-09 07:42:13'),
(132, 62, 13, '🔚 La session est terminée', 'system', '2025-07-09 07:42:24'),
(133, 59, 15, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-09 10:10:03'),
(134, 56, 15, '👋 Un élève undefined a rejoint la session', 'system', '2025-07-09 10:11:29');

-- --------------------------------------------------------

--
-- Table structure for table `live_participants`
--

CREATE TABLE `live_participants` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp NULL DEFAULT current_timestamp(),
  `left_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `role` enum('teacher','student','moderator') DEFAULT 'student'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `live_participants`
--

INSERT INTO `live_participants` (`id`, `session_id`, `user_id`, `joined_at`, `left_at`, `is_active`, `role`) VALUES
(1, 7, 1, '2025-06-25 07:52:21', '2025-06-25 07:52:58', 0, 'teacher'),
(5, 8, 1, '2025-06-25 08:14:15', '2025-06-25 08:17:19', 0, 'teacher'),
(7, 8, 12, '2025-06-25 07:53:30', '2025-06-25 07:54:28', 0, 'student'),
(13, 9, 13, '2025-06-25 12:09:45', '2025-06-25 12:13:38', 0, 'teacher'),
(16, 10, 13, '2025-06-26 08:45:19', '2025-06-26 09:13:04', 0, 'teacher'),
(20, 10, 8, '2025-06-26 08:45:07', '2025-06-26 10:22:46', 0, 'student'),
(25, 11, 13, '2025-06-27 07:11:47', '2025-06-27 07:12:59', 0, 'teacher'),
(28, 12, 13, '2025-06-27 09:48:42', '2025-06-27 11:08:14', 0, 'teacher'),
(32, 12, 8, '2025-06-27 09:49:45', '2025-06-27 11:08:14', 0, 'student'),
(35, 13, 13, '2025-06-30 07:52:36', '2025-06-30 07:53:24', 0, 'teacher'),
(39, 14, 13, '2025-06-30 06:43:44', '2025-06-30 06:50:33', 0, 'teacher'),
(41, 15, 13, '2025-06-30 07:53:28', '2025-06-30 07:56:58', 0, 'teacher'),
(48, 1, 8, '2025-06-30 08:13:01', '2025-06-30 08:13:21', 0, 'student'),
(51, 16, 1, '2025-07-01 10:55:45', '2025-07-01 10:58:03', 0, 'teacher'),
(53, 17, 13, '2025-07-02 08:12:09', '2025-07-02 08:19:25', 0, 'teacher'),
(54, 17, 10, '2025-07-02 08:12:20', '2025-07-02 08:19:25', 0, 'student'),
(57, 18, 13, '2025-07-02 08:19:44', '2025-07-02 08:24:56', 0, 'teacher'),
(58, 18, 10, '2025-07-02 08:23:30', '2025-07-02 08:25:09', 0, 'student'),
(67, 19, 13, '2025-07-02 08:51:09', '2025-07-02 09:04:32', 0, 'teacher'),
(68, 19, 10, '2025-07-02 08:51:23', '2025-07-02 09:04:29', 0, 'student'),
(74, 20, 13, '2025-07-02 09:07:10', '2025-07-02 09:07:34', 0, 'teacher'),
(78, 20, 10, '2025-07-02 09:07:24', '2025-07-02 09:07:41', 0, 'student'),
(80, 21, 13, '2025-07-02 09:08:52', '2025-07-02 09:21:05', 0, 'teacher'),
(81, 1, 13, '2025-07-02 09:08:42', '2025-07-02 09:08:49', 0, 'student'),
(86, 22, 13, '2025-07-02 09:27:22', '2025-07-02 09:29:37', 0, 'teacher'),
(88, 22, 10, '2025-07-02 09:27:39', '2025-07-02 09:46:21', 0, 'student'),
(90, 23, 13, '2025-07-02 11:53:21', '2025-07-03 07:01:34', 0, 'teacher'),
(93, 23, 10, '2025-07-02 09:37:07', '2025-07-02 09:46:21', 0, 'student'),
(97, 24, 13, '2025-07-03 07:01:52', '2025-07-03 07:02:44', 0, 'teacher'),
(99, 25, 13, '2025-07-03 07:08:26', '2025-07-03 07:13:49', 0, 'teacher'),
(100, 28, 13, '2025-07-03 08:09:02', '2025-07-03 08:09:02', 0, 'teacher'),
(103, 29, 13, '2025-07-03 08:09:13', '2025-07-03 08:45:41', 0, 'teacher'),
(105, 40, 10, '2025-07-03 10:46:31', NULL, 1, 'student'),
(106, 40, 13, '2025-07-03 10:46:49', NULL, 1, 'teacher'),
(107, 44, 10, '2025-07-03 12:35:26', '2025-07-03 12:36:12', 0, 'student'),
(108, 45, 10, '2025-07-03 12:42:06', '2025-07-03 12:42:41', 0, 'student'),
(109, 46, 10, '2025-07-03 12:47:45', '2025-07-03 13:00:11', 0, 'student'),
(110, 47, 10, '2025-07-03 13:00:40', NULL, 1, 'student'),
(111, 48, 10, '2025-07-03 13:07:15', NULL, 1, 'student'),
(112, 49, 10, '2025-07-04 06:35:34', '2025-07-04 07:00:14', 0, 'student'),
(113, 50, 10, '2025-07-04 07:00:57', NULL, 1, 'student'),
(114, 51, 10, '2025-07-04 07:30:54', NULL, 1, 'student'),
(115, 53, 10, '2025-07-06 19:36:07', NULL, 1, 'student'),
(116, 54, 10, '2025-07-07 11:02:44', '2025-07-07 11:03:26', 0, 'student'),
(117, 55, 10, '2025-07-08 08:08:40', '2025-07-08 08:09:22', 0, 'student'),
(118, 57, 10, '2025-07-08 09:10:29', '2025-07-08 09:13:47', 0, 'student'),
(119, 62, 10, '2025-07-09 07:42:13', '2025-07-09 07:42:24', 0, 'student'),
(120, 59, 15, '2025-07-09 10:10:03', NULL, 1, 'student'),
(121, 56, 15, '2025-07-09 10:11:29', NULL, 1, 'student');

-- --------------------------------------------------------

--
-- Table structure for table `live_sessions`
--

CREATE TABLE `live_sessions` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `max_participants` int(11) DEFAULT 50,
  `current_participants` int(11) DEFAULT 0,
  `status` enum('waiting','live','ended') DEFAULT 'waiting',
  `room_code` varchar(20) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `live_sessions`
--

INSERT INTO `live_sessions` (`id`, `teacher_id`, `title`, `description`, `subject`, `max_participants`, `current_participants`, `status`, `room_code`, `password`, `started_at`, `ended_at`, `created_at`, `updated_at`) VALUES
(1, 11, 'Cours de Mathématiques - Les Fractions', 'Découverte des fractions pour les débutants', 'Mathématiques', 50, 0, 'live', 'MATH0001', NULL, '2025-06-24 07:46:38', NULL, '2025-06-23 11:10:20', '2025-07-02 09:08:49'),
(2, 11, 'Sciences - Le Système Solaire', 'Exploration des planètes et du système solaire', 'Sciences', 50, 3, 'live', 'SCI0001', NULL, '2025-06-23 11:10:20', NULL, '2025-06-23 11:10:20', '2025-06-23 11:10:20'),
(3, 11, 'Histoire - Les Dinosaures', 'Découverte des dinosaures et de la préhistoire', 'Histoire', 50, 0, 'ended', 'HIST0001', NULL, NULL, NULL, '2025-06-23 11:10:20', '2025-06-23 11:10:20'),
(7, 1, 'dfvfd', 'bgfhytr', 'gtrfgt', 30, 0, 'ended', 'IS4494', NULL, '2025-06-25 07:52:08', '2025-06-25 07:53:03', '2025-06-25 07:43:42', '2025-06-25 07:53:03'),
(8, 1, 'gfvfged', 'gfbhtgtrf', 'fgffbg', 30, 0, 'ended', 'AA5225', NULL, '2025-06-25 07:53:50', '2025-06-25 11:24:58', '2025-06-25 07:53:13', '2025-06-25 11:24:58'),
(9, 13, 'gfdf', 'gfdefg', 'fdfd', 30, 0, 'ended', 'SG4173', NULL, '2025-06-25 12:09:45', '2025-06-26 07:15:13', '2025-06-25 12:09:22', '2025-06-26 07:15:13'),
(10, 13, 'gfgrte', 'gfgr', 'frfgf', 30, 0, 'ended', 'BR6739', NULL, '2025-06-26 07:39:54', '2025-06-27 07:11:30', '2025-06-26 07:39:46', '2025-06-27 07:11:30'),
(11, 13, 'freds', 'gtfbgrfd', 'gfgtre', 30, 0, 'ended', 'OP9127', NULL, '2025-06-27 07:11:47', '2025-06-27 07:13:04', '2025-06-27 07:11:40', '2025-06-27 07:13:04'),
(12, 13, 'fd', 'fgred', 'dfred', 30, 0, 'ended', 'DH3694', NULL, '2025-06-27 09:48:42', '2025-06-30 05:32:53', '2025-06-27 09:48:35', '2025-06-30 05:32:53'),
(13, 13, 'ffrd', 'frdff', 'dfredf', 30, 0, 'ended', 'FM1587', NULL, '2025-06-30 07:52:36', '2025-06-30 08:11:15', '2025-06-30 05:33:10', '2025-06-30 08:11:15'),
(14, 13, 'bfvd', 'fghyhgref', 'fghytr', 30, 0, 'ended', 'DU0291', NULL, '2025-06-30 06:43:52', '2025-06-30 08:11:11', '2025-06-30 06:43:44', '2025-06-30 08:11:11'),
(15, 13, 'ghgfd', 'ghgffg', 'htr', 30, 0, 'ended', 'FJ2265', NULL, '2025-06-30 07:02:25', '2025-06-30 08:11:09', '2025-06-30 07:02:20', '2025-06-30 08:11:09'),
(16, 1, 'fedfvbfgF', 'ferd', 'dfrde', 30, 0, 'ended', 'VU7710', NULL, '2025-07-01 10:55:47', '2025-07-01 10:58:42', '2025-07-01 10:55:45', '2025-07-01 10:58:42'),
(17, 13, 'testing', NULL, 'info', 30, 2, 'ended', 'OV5646', NULL, '2025-07-02 08:12:27', '2025-07-02 08:19:25', '2025-07-02 08:12:09', '2025-07-02 08:19:25'),
(18, 13, 'test2', NULL, 'info', 30, 0, 'ended', 'XJ9252', NULL, '2025-07-02 08:19:58', '2025-07-02 08:25:04', '2025-07-02 08:19:44', '2025-07-02 08:25:09'),
(19, 13, 'test 3', NULL, 'info', 30, 0, 'ended', 'SZ7591', NULL, '2025-07-02 08:51:08', '2025-07-02 09:05:02', '2025-07-02 08:50:27', '2025-07-02 09:05:02'),
(20, 13, 'test 4', NULL, 'info', 30, 0, 'ended', 'DP3207', NULL, '2025-07-02 09:07:10', '2025-07-02 09:07:47', '2025-07-02 09:06:52', '2025-07-02 09:07:47'),
(21, 13, 'test 5', NULL, 'info', 30, 0, 'waiting', 'BF0931', NULL, NULL, NULL, '2025-07-02 09:07:57', '2025-07-02 09:21:05'),
(22, 13, 'test 6', NULL, 'info', 30, 0, 'ended', 'UJ5152', NULL, '2025-07-02 09:27:22', '2025-07-03 07:01:39', '2025-07-02 09:25:52', '2025-07-03 07:01:39'),
(23, 13, 'test 7', NULL, 'info', 30, 1, 'ended', 'VW3781', NULL, '2025-07-02 09:36:33', '2025-07-03 07:01:34', '2025-07-02 09:36:20', '2025-07-03 07:01:34'),
(24, 13, 'test 8', NULL, 'info', 30, 0, 'waiting', 'JS3615', NULL, NULL, NULL, '2025-07-03 07:01:52', '2025-07-03 07:02:44'),
(25, 13, 'test 9', NULL, 'info', 30, 0, 'live', 'UH9782', NULL, '2025-07-03 07:08:37', NULL, '2025-07-03 07:08:25', '2025-07-03 07:13:49'),
(26, 13, 'test 10', NULL, 'info', 30, 0, 'waiting', 'KS4115', NULL, NULL, NULL, '2025-07-03 07:53:58', '2025-07-03 07:53:58'),
(27, 13, 'test 11', NULL, 'info', 30, 0, 'waiting', 'GN0343', NULL, NULL, NULL, '2025-07-03 08:02:59', '2025-07-03 08:02:59'),
(28, 13, 'test 12', NULL, 'info', 30, 0, 'waiting', 'JS8192', NULL, NULL, NULL, '2025-07-03 08:07:30', '2025-07-03 08:09:02'),
(29, 13, 'tedt 12', NULL, 'info', 30, 0, 'waiting', 'VN2354', NULL, NULL, NULL, '2025-07-03 08:09:12', '2025-07-03 08:45:41'),
(30, 13, 'test agora 1', NULL, 'info', 30, 0, 'waiting', 'YE6531', NULL, NULL, NULL, '2025-07-03 08:48:08', '2025-07-03 08:48:08'),
(31, 13, 'test agora 2', NULL, 'info', 30, 0, 'waiting', 'BY6493', NULL, NULL, NULL, '2025-07-03 08:57:48', '2025-07-03 08:57:48'),
(32, 13, 'ted', NULL, NULL, 30, 0, 'waiting', 'NH5119', NULL, NULL, NULL, '2025-07-03 09:03:43', '2025-07-03 09:03:43'),
(33, 13, 'test agora 3', NULL, NULL, 30, 0, 'waiting', 'NK9589', NULL, NULL, NULL, '2025-07-03 09:12:39', '2025-07-03 09:12:39'),
(34, 13, 'test agora 4', NULL, NULL, 30, 0, 'waiting', 'PN2038', NULL, NULL, NULL, '2025-07-03 09:15:41', '2025-07-03 09:15:41'),
(35, 13, 'test agora 5', NULL, NULL, 30, 0, 'waiting', 'VZ7749', NULL, NULL, NULL, '2025-07-03 09:20:29', '2025-07-03 09:20:29'),
(36, 13, 'test agora 6', NULL, NULL, 30, 0, 'live', 'WY2878', NULL, '2025-07-03 09:22:49', NULL, '2025-07-03 09:22:31', '2025-07-03 09:22:49'),
(37, 13, 'test agora 7', NULL, NULL, 30, 0, 'waiting', 'FJ4251', NULL, NULL, NULL, '2025-07-03 09:40:13', '2025-07-03 09:40:13'),
(38, 13, 'test agora 5', NULL, NULL, 30, 0, 'waiting', 'GA1690', NULL, NULL, NULL, '2025-07-03 09:52:50', '2025-07-03 09:52:50'),
(39, 13, 'test agora 8', NULL, NULL, 30, 0, 'waiting', 'KP5653', NULL, NULL, NULL, '2025-07-03 09:57:16', '2025-07-03 09:57:16'),
(40, 13, 'test local', NULL, NULL, 30, 2, 'waiting', 'TK3108', NULL, NULL, NULL, '2025-07-03 10:46:06', '2025-07-03 10:46:49'),
(41, 13, 'test agora 10', NULL, NULL, 30, 0, 'waiting', 'WI7072', NULL, NULL, NULL, '2025-07-03 12:17:47', '2025-07-03 12:17:47'),
(42, 13, 'agora', NULL, NULL, 30, 0, 'ended', 'PN5674', NULL, '2025-07-03 12:22:15', '2025-07-03 12:32:38', '2025-07-03 12:21:56', '2025-07-03 12:32:38'),
(43, 13, 'grf', NULL, NULL, 30, 0, 'ended', 'DF3503', NULL, '2025-07-03 12:33:05', '2025-07-03 12:33:33', '2025-07-03 12:32:50', '2025-07-03 12:33:33'),
(44, 13, 'hgdfgfh', NULL, NULL, 30, 1, 'ended', 'WE9114', NULL, '2025-07-03 12:35:17', '2025-07-03 12:36:12', '2025-07-03 12:34:20', '2025-07-03 12:36:12'),
(45, 13, 'testin 1', NULL, NULL, 30, 1, 'ended', 'OS1271', NULL, '2025-07-03 12:41:55', '2025-07-03 12:42:41', '2025-07-03 12:41:32', '2025-07-03 12:42:41'),
(46, 13, 'alle', NULL, NULL, 30, 1, 'ended', 'YN8682', NULL, '2025-07-03 12:46:16', '2025-07-03 13:00:11', '2025-07-03 12:45:47', '2025-07-03 13:00:11'),
(47, 13, 'local', NULL, NULL, 30, 1, 'live', 'NE5249', NULL, '2025-07-03 13:00:27', NULL, '2025-07-03 13:00:21', '2025-07-03 13:00:40'),
(48, 13, 'akha', NULL, NULL, 30, 1, 'live', 'CR1884', NULL, '2025-07-03 13:06:34', NULL, '2025-07-03 13:05:51', '2025-07-03 13:07:15'),
(49, 13, 'vamos', NULL, NULL, 30, 1, 'ended', 'PR1813', NULL, '2025-07-04 06:35:23', '2025-07-04 07:00:14', '2025-07-04 06:34:59', '2025-07-04 07:00:14'),
(50, 13, 'bismillah', NULL, NULL, 30, 1, 'live', 'GJ1443', NULL, '2025-07-04 07:00:44', NULL, '2025-07-04 07:00:33', '2025-07-04 07:00:57'),
(51, 13, 'djamoua', NULL, NULL, 30, 1, 'live', 'BY5326', NULL, '2025-07-04 07:30:47', NULL, '2025-07-04 07:30:24', '2025-07-04 07:30:54'),
(52, 13, 'tes', NULL, NULL, 30, 0, 'ended', 'GO5536', NULL, '2025-07-06 12:56:03', '2025-07-06 12:56:19', '2025-07-06 12:55:46', '2025-07-06 12:56:19'),
(53, 13, 'night', NULL, NULL, 30, 1, 'live', 'YF0503', NULL, '2025-07-06 19:33:36', NULL, '2025-07-06 19:33:24', '2025-07-06 19:36:07'),
(54, 13, 'salut', NULL, NULL, 30, 1, 'ended', 'LH0190', NULL, '2025-07-07 11:02:33', '2025-07-07 11:03:26', '2025-07-07 11:02:10', '2025-07-07 11:03:26'),
(55, 13, 'mardi', NULL, NULL, 30, 1, 'ended', 'CB8433', NULL, '2025-07-08 08:06:49', '2025-07-08 08:09:22', '2025-07-08 08:06:31', '2025-07-08 08:09:22'),
(56, 13, 'pb', NULL, NULL, 30, 1, 'live', 'GD9952', NULL, '2025-07-08 09:06:12', NULL, '2025-07-08 09:05:52', '2025-07-09 10:11:29'),
(57, 13, 'ld', NULL, NULL, 30, 1, 'ended', 'UA9993', NULL, '2025-07-08 09:08:38', '2025-07-08 09:13:47', '2025-07-08 09:08:33', '2025-07-08 09:13:47'),
(58, 13, 'll', NULL, NULL, 30, 0, 'waiting', 'WL3949', NULL, NULL, NULL, '2025-07-08 09:13:55', '2025-07-08 09:13:55'),
(59, 13, 'lll', NULL, NULL, 30, 1, 'live', 'BF2896', NULL, '2025-07-08 09:43:08', NULL, '2025-07-08 09:43:03', '2025-07-09 10:10:03'),
(60, 13, 'lolo', NULL, NULL, 30, 0, 'waiting', 'RW5172', NULL, NULL, NULL, '2025-07-09 07:32:34', '2025-07-09 07:32:34'),
(61, 13, 'frf', NULL, NULL, 30, 0, 'waiting', 'RN8546', NULL, NULL, NULL, '2025-07-09 07:33:37', '2025-07-09 07:33:37'),
(62, 13, 'co', NULL, NULL, 30, 1, 'ended', 'CT0090', NULL, '2025-07-09 07:42:06', '2025-07-09 07:42:24', '2025-07-09 07:40:47', '2025-07-09 07:42:24');

-- --------------------------------------------------------

--
-- Table structure for table `live_session_messages`
--

CREATE TABLE `live_session_messages` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `message_type` enum('text','system','user') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `content`, `is_read`, `created_at`) VALUES
(1, 1, 11, 'salut', 1, '2025-06-20 12:58:27'),
(2, 1, 11, 'salut l amis', 1, '2025-06-20 12:58:39'),
(3, 1, 11, 'sava', 1, '2025-06-20 12:58:46'),
(4, 1, 11, 'salut ton fils fait des betise', 1, '2025-06-20 13:51:11'),
(5, 1, 1, 'et toit tu dis rien', 1, '2025-06-23 10:28:41'),
(6, 1, 11, 'et alors', 0, '2025-06-23 10:29:34'),
(7, 2, 12, 'message', 1, '2025-06-23 13:34:04'),
(8, 2, 13, 'merci', 1, '2025-06-23 13:34:38'),
(9, 2, 13, 'test', 1, '2025-06-25 15:02:24'),
(10, 2, 13, 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 1, '2025-06-25 15:08:48'),
(11, 2, 13, 'test', 1, '2025-06-25 15:08:51'),
(12, 2, 13, 'r', 1, '2025-06-25 15:08:54'),
(13, 2, 13, 'rt', 1, '2025-06-25 15:08:55'),
(14, 2, 13, 'testt', 1, '2025-06-25 15:09:08'),
(15, 2, 13, 'testtt', 1, '2025-06-25 15:09:13'),
(16, 2, 13, 'test123', 1, '2025-06-25 15:09:22'),
(17, 2, 13, 'test1234', 1, '2025-06-25 15:09:25'),
(18, 2, 13, 'test12345', 1, '2025-06-25 15:09:28'),
(19, 2, 13, 'test123456', 1, '2025-06-25 15:09:33'),
(20, 2, 13, 'test123123', 1, '2025-06-25 15:09:37'),
(21, 2, 13, 'testtest', 1, '2025-06-25 15:09:40'),
(22, 2, 13, 'testestestestest', 1, '2025-06-25 15:09:44'),
(23, 2, 13, 'test', 1, '2025-06-25 16:29:39'),
(24, 2, 13, 'Test', 1, '2025-06-25 16:29:54'),
(25, 2, 12, 'test', 1, '2025-06-26 07:58:18'),
(26, 2, 13, 'test', 0, '2025-06-26 17:48:57'),
(27, 3, 15, 'hey', 0, '2025-06-27 13:28:35'),
(29, 3, 15, 'hello', 0, '2025-07-08 14:31:22');

-- --------------------------------------------------------

--
-- Table structure for table `mini_games`
--

CREATE TABLE `mini_games` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('flash_cards','branching_adventure') NOT NULL,
  `description` text DEFAULT NULL,
  `target_cycle` enum('cycle_3','cycle_4','terminal') NOT NULL,
  `subject` varchar(50) NOT NULL,
  `difficulty_level` enum('facile','moyen','difficile') NOT NULL,
  `theme` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mini_games`
--

INSERT INTO `mini_games` (`id`, `name`, `type`, `description`, `target_cycle`, `subject`, `difficulty_level`, `theme`, `is_active`, `created_at`, `updated_at`, `image_url`) VALUES
(1, 'Battle Quiz', '', 'Défie tes connaissances ! Réponds à des questions personnalisées selon ta matière et ton niveau pour gagner des XP', '', 'all', '', 'educational', 1, '2025-07-01 10:48:52', '2025-07-01 10:49:03', '/assets/games/battle-quiz.png'),
(2, 'Memory Match', '', 'Entraîne ta mémoire ! Associe les concepts, définitions ou formules de ta matière dans ce jeu de cartes', '', 'all', '', 'educational', 1, '2025-07-01 10:48:52', '2025-07-01 10:49:03', '/assets/games/memory-match.png'),
(3, 'Logic Builder', '', 'Construis la logique ! Remets dans l\'ordre les étapes, événements ou processus selon ton domaine d\'étude', '', 'all', '', 'educational', 1, '2025-07-01 10:48:52', '2025-07-01 10:49:03', '/assets/games/logic-builder.png'),
(15, 'Knowledge Maze Explorer', 'branching_adventure', 'Naviguez dans un labyrinthe interactif et résolvez des défis éducatifs pour progresser !', 'cycle_4', 'multi-matières', 'moyen', 'aventure-éducative', 1, '2025-07-07 13:55:12', '2025-07-07 13:55:12', '/assets/games/maze-explorer.svg');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('like','comment','follow','message','achievement') NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `related_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parental_controls`
--

CREATE TABLE `parental_controls` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `child_id` int(11) NOT NULL,
  `daily_time_limit_minutes` int(11) DEFAULT 60,
  `allowed_start_time` time DEFAULT '09:00:00',
  `allowed_end_time` time DEFAULT '20:00:00',
  `allowed_subjects` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowed_subjects`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parental_controls`
--

INSERT INTO `parental_controls` (`id`, `parent_id`, `child_id`, `daily_time_limit_minutes`, `allowed_start_time`, `allowed_end_time`, `allowed_subjects`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 8, 60, '09:00:00', '20:00:00', '[\"Mathématiques\", \"Français\", \"Sciences\", \"Histoire\"]', 1, '2025-06-19 12:20:07', '2025-06-19 12:20:07'),
(2, 7, 8, 60, '09:00:00', '20:00:00', '[\"Mathématiques\", \"Français\", \"Sciences\", \"Histoire\"]', 1, '2025-06-19 12:20:07', '2025-06-19 12:20:07'),
(3, 9, 8, 60, '09:00:00', '20:00:00', '[\"Mathématiques\", \"Français\", \"Sciences\", \"Histoire\"]', 1, '2025-06-19 12:20:07', '2025-06-19 12:20:07'),
(4, 9, 10, 60, '09:00:00', '20:00:00', '[\"Mathématiques\", \"Français\", \"Sciences\", \"Histoire\"]', 1, '2025-06-19 12:20:07', '2025-06-19 12:20:07');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `user_id`, `content`, `image`, `created_at`) VALUES
(1, 3, 'salut', NULL, '2025-06-18 14:09:19'),
(2, 3, 'je suis le developpeur\r\n', '1750256395055.png', '2025-06-18 14:19:55'),
(3, 13, 'test3', NULL, '2025-06-25 15:05:51'),
(4, 15, 'test', NULL, '2025-07-04 12:13:26');

-- --------------------------------------------------------

--
-- Table structure for table `post_likes`
--

CREATE TABLE `post_likes` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post_likes`
--

INSERT INTO `post_likes` (`id`, `post_id`, `user_id`, `created_at`) VALUES
(2, 3, 13, '2025-06-25 15:08:37'),
(4, 3, 15, '2025-07-02 07:23:57'),
(11, 4, 15, '2025-07-09 09:28:53'),
(10, 2, 15, '2025-07-08 16:02:53'),
(8, 1, 15, '2025-07-08 16:02:49');

-- --------------------------------------------------------

--
-- Table structure for table `quests`
--

CREATE TABLE `quests` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `subject` varchar(100) NOT NULL,
  `difficulty` enum('easy','medium','hard') NOT NULL,
  `points` int(11) DEFAULT 10,
  `fragments_reward` int(11) DEFAULT 5,
  `min_level` int(11) DEFAULT 1,
  `max_level` int(11) DEFAULT 100,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quests`
--

INSERT INTO `quests` (`id`, `title`, `description`, `subject`, `difficulty`, `points`, `fragments_reward`, `min_level`, `max_level`, `is_active`, `created_at`) VALUES
(1, 'Addition Magique', 'Résolvez 10 additions simples', 'Mathématiques', 'easy', 10, 5, 1, 100, 1, '2025-06-19 12:20:07'),
(2, 'Tables de Multiplication', 'Maîtrisez les tables de 1 à 5', 'Mathématiques', 'medium', 20, 10, 1, 100, 1, '2025-06-19 12:20:07'),
(3, 'Lecture du Jour', 'Lisez une histoire courte', 'Français', 'easy', 15, 7, 1, 100, 1, '2025-06-19 12:20:07'),
(4, 'Orthographe Champion', 'Écrivez 20 mots sans faute', 'Français', 'medium', 25, 12, 1, 100, 1, '2025-06-19 12:20:07'),
(5, 'Découverte Scientifique', 'Apprenez les états de la matière', 'Sciences', 'medium', 30, 15, 1, 100, 1, '2025-06-19 12:20:07'),
(6, 'Voyage dans le Temps', 'Explorez l\'Égypte antique', 'Histoire', 'hard', 40, 20, 1, 100, 1, '2025-06-19 12:20:07'),
(7, 'Hello World', 'Apprenez les salutations en anglais', 'Anglais', 'easy', 12, 6, 1, 100, 1, '2025-06-19 12:20:07'),
(8, 'Géographie Mystère', 'Trouvez 5 capitales européennes', 'Géographie', 'medium', 22, 11, 1, 100, 1, '2025-06-19 12:20:07'),
(9, 'Création Artistique', 'Dessinez votre animal préféré', 'Art', 'easy', 18, 9, 1, 100, 1, '2025-06-19 12:20:07'),
(10, 'Rythme et Mélodie', 'Identifiez 5 instruments de musique', 'Musique', 'easy', 16, 8, 1, 100, 1, '2025-06-19 12:20:07'),
(11, 'Addition Magique', 'Résolvez 10 additions simples', 'Mathématiques', 'easy', 10, 5, 1, 100, 1, '2025-06-19 12:24:39'),
(12, 'Tables de Multiplication', 'Maîtrisez les tables de 1 à 5', 'Mathématiques', 'medium', 20, 10, 1, 100, 1, '2025-06-19 12:24:39'),
(13, 'Lecture du Jour', 'Lisez une histoire courte', 'Français', 'easy', 15, 7, 1, 100, 1, '2025-06-19 12:24:39'),
(14, 'Orthographe Champion', 'Écrivez 20 mots sans faute', 'Français', 'medium', 25, 12, 1, 100, 1, '2025-06-19 12:24:39'),
(15, 'Découverte Scientifique', 'Apprenez les états de la matière', 'Sciences', 'medium', 30, 15, 1, 100, 1, '2025-06-19 12:24:39'),
(16, 'Voyage dans le Temps', 'Explorez l\'Égypte antique', 'Histoire', 'hard', 40, 20, 1, 100, 1, '2025-06-19 12:24:39'),
(17, 'Hello World', 'Apprenez les salutations en anglais', 'Anglais', 'easy', 12, 6, 1, 100, 1, '2025-06-19 12:24:39'),
(18, 'Géographie Mystère', 'Trouvez 5 capitales européennes', 'Géographie', 'medium', 22, 11, 1, 100, 1, '2025-06-19 12:24:39'),
(19, 'Création Artistique', 'Dessinez votre animal préféré', 'Art', 'easy', 18, 9, 1, 100, 1, '2025-06-19 12:24:39'),
(20, 'Rythme et Mélodie', 'Identifiez 5 instruments de musique', 'Musique', 'easy', 16, 8, 1, 100, 1, '2025-06-19 12:24:39');

-- --------------------------------------------------------

--
-- Table structure for table `rag_documents`
--

CREATE TABLE `rag_documents` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `document_type` enum('programme','cours','exercice','guide') DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `is_indexed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `account_type` enum('parent','child','teacher') NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `level` int(11) DEFAULT 1,
  `quests_completed` int(11) DEFAULT 0,
  `fragments` int(11) DEFAULT 0,
  `badges` text DEFAULT NULL,
  `user_rank` varchar(50) DEFAULT 'Novice',
  `style` varchar(50) DEFAULT 'default',
  `parent_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `email`, `password`, `account_type`, `profile_picture`, `level`, `quests_completed`, `fragments`, `badges`, `user_rank`, `style`, `parent_id`, `created_at`) VALUES
(1, 'billel hakkas', 'bils', 'billel.hakkas@gmail.com', '$2b$10$Qo9OybdardN/qaxjfW6t7uLO27X1BPz3C6GHwNiTF92hVmgi5pRGK', 'parent', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-18 13:49:27'),
(2, 'billel', 'papa billel', 'billel@gmail.com', '$2b$10$f0DqxxiFsTuEp2cmjtBtg.ZZ4l17flZ5YtMQw9mhdybnQniG8iO7e', 'parent', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-18 14:01:06'),
(3, 'billel hakkas', 'paps', 'bills@gmail.com', '$2b$10$3.J5xjpckZdOF9bcK81qSuvE1Ky02q8TC7twRvwl.iM0eYC0czfvy', 'parent', '1750255719097.png', 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-18 14:07:37'),
(4, 'billel hakkas', 'P2300355', 'bille@gmail.com', '$2b$10$6zZWsUZzmMQUKVLyDli/K.FcldZzMu.4YuHSb2PhA1OjHq4lzqvIu', 'parent', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-19 09:41:01'),
(5, 'billel hakkas', 'seseses', 'bi@gmail.com', '$2b$10$seRvLaarckwWFucUDqv9U.xtrtKPpQwqnk1So024Y/OO47AsqgUeq', 'parent', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-19 10:20:20'),
(6, 'billel hakkas', 'fgredfg', 'b@gmail.com', '$2b$10$MidRnhIFSq/HTENsnv9Hc.QhSCHX0PRXYO0VW2oTsVg4.WqMj8sia', 'parent', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-19 10:53:55'),
(7, 'billel hakkas', 'fdez', 'sz@gm.Dp', '$2b$10$sKPnTXOo3H94I5PVIZui.ugDbzkKRNU4GOc.sISZ7726XR7Ti9uYy', 'parent', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-19 11:04:13'),
(8, 'fdsd', 'fdcvgf', 'dfredf@rfgf.ffd', '$2b$10$3h15cQ6ffvNQuIaQNYE1JejKAI6Vm3YdHjs9hwWHhH8o1xPoH6ucy', 'child', NULL, 1, 0, 0, NULL, 'Novice', 'default', 7, '2025-06-19 11:04:29'),
(9, 'dfrd', 'fffr', 'fvr@vfr.d', '$2b$10$DsNwBU97FEgi0ArnwV81VOJZiK4Y5dZbSJMAzz29525UAGkc98oUq', 'parent', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-19 11:34:45'),
(10, 'fgfd', 'vff', 'fr@fg.do', '$2b$10$qLPqzJerRR4MVC5AIGGL2uHg3zJjucQIvRqfTxuxec/j9JbeC5qs6', 'child', NULL, 1, 0, 0, NULL, 'Novice', 'default', 9, '2025-06-19 11:35:01'),
(11, 'billel hakkas', 'vfdc', 'akkas@gmail.com', '$2b$10$EzmwMJEgQCbPrflI.rq.7ePN01SLnEHpyIu7Xrh1/uyHexm2Gd.jG', 'parent', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-20 12:08:12'),
(12, 'testparent', 'parent1', 'test@parent.com', '$2b$10$jeF5w6tTeBVG3LMDb.ga3.906TxgBLFSkiCAu1ZNpJ3xk3Nb.Ut1C', 'parent', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-23 13:32:25'),
(15, 'enfan un', 'enfant1', 'enfant1@test.com', '$2b$10$44hNf8SOsLJSdiMacF.QeewbHeJeB4MZwDfyTk6jh9ZGFqYJEkqoi', 'child', '1751618062486-699645256.png', 1, 0, 0, NULL, 'Novice', 'default', 12, '2025-06-27 11:31:13'),
(16, 'Test User', 'testuser', 'test@example.com', '$2b$10$jclfUD1r.IjFnZ5pe25IX.kslxMGgDP8AUd4RT8rIJUW1sevwWyiG', 'child', NULL, 1, 0, 0, NULL, 'Novice', 'default', NULL, '2025-06-27 13:08:31');

-- --------------------------------------------------------

--
-- Table structure for table `user_achievements`
--

CREATE TABLE `user_achievements` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `achievement_id` int(11) NOT NULL,
  `earned_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_game_progress`
--

CREATE TABLE `user_game_progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `game_type` enum('flash_cards','branching_adventure') NOT NULL,
  `total_sessions` int(11) DEFAULT 0,
  `total_xp` int(11) DEFAULT 0,
  `best_score` int(11) DEFAULT 0,
  `current_level` int(11) DEFAULT 1,
  `last_played` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_game_progress`
--

INSERT INTO `user_game_progress` (`id`, `user_id`, `game_type`, `total_sessions`, `total_xp`, `best_score`, `current_level`, `last_played`) VALUES
(2, 15, '', 41, 193, 100, 1, '2025-07-09 09:38:57'),
(3, 15, 'branching_adventure', 27, 80, 700, 1, '2025-07-09 09:39:34');

-- --------------------------------------------------------

--
-- Table structure for table `user_quests`
--

CREATE TABLE `user_quests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quest_id` int(11) NOT NULL,
  `completed_at` timestamp NULL DEFAULT current_timestamp(),
  `score` int(11) DEFAULT NULL,
  `time_taken_minutes` int(11) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_tokens`
--

CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `total_tokens` bigint(20) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `achievements`
--
ALTER TABLE `achievements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `ai_conversations`
--
ALTER TABLE `ai_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_session` (`user_id`,`session_id`),
  ADD KEY `idx_model` (`model_used`);

--
-- Indexes for table `ai_usage_stats`
--
ALTER TABLE `ai_usage_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_date` (`date`);

--
-- Indexes for table `child_parent_links`
--
ALTER TABLE `child_parent_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_relation` (`parent_id`,`child_id`),
  ADD KEY `idx_child_parent_links_parent_id` (`parent_id`),
  ADD KEY `idx_child_parent_links_child_id` (`child_id`);

--
-- Indexes for table `child_reports`
--
ALTER TABLE `child_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_child_date_report` (`child_id`,`report_date`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `post_id` (`post_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `comment_likes`
--
ALTER TABLE `comment_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_comment_like` (`comment_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `participant1_id` (`participant1_id`),
  ADD KEY `participant2_id` (`participant2_id`);

--
-- Indexes for table `followers`
--
ALTER TABLE `followers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_follow` (`follower_id`,`followed_id`),
  ADD KEY `followed_id` (`followed_id`);

--
-- Indexes for table `game_rewards`
--
ALTER TABLE `game_rewards`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `game_sessions`
--
ALTER TABLE `game_sessions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `learning_sessions`
--
ALTER TABLE `learning_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_like` (`user_id`,`post_id`),
  ADD KEY `post_id` (`post_id`);

--
-- Indexes for table `live_chat`
--
ALTER TABLE `live_chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `live_participants`
--
ALTER TABLE `live_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participant` (`session_id`,`user_id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `live_sessions`
--
ALTER TABLE `live_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_code` (`room_code`),
  ADD KEY `idx_teacher_id` (`teacher_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `live_session_messages`
--
ALTER TABLE `live_session_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `fk_messages_conversation_id` (`conversation_id`);

--
-- Indexes for table `mini_games`
--
ALTER TABLE `mini_games`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `parental_controls`
--
ALTER TABLE `parental_controls`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_parent_child_control` (`parent_id`,`child_id`),
  ADD KEY `child_id` (`child_id`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `post_likes`
--
ALTER TABLE `post_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_post_like` (`post_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `quests`
--
ALTER TABLE `quests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rag_documents`
--
ALTER TABLE `rag_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subject_level` (`subject`,`level`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_username` (`username`),
  ADD KEY `idx_users_account_type` (`account_type`),
  ADD KEY `idx_users_parent_id` (`parent_id`);

--
-- Indexes for table `user_achievements`
--
ALTER TABLE `user_achievements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_achievement` (`user_id`,`achievement_id`),
  ADD KEY `achievement_id` (`achievement_id`);

--
-- Indexes for table `user_game_progress`
--
ALTER TABLE `user_game_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_game` (`user_id`,`game_type`);

--
-- Indexes for table `user_quests`
--
ALTER TABLE `user_quests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_quest` (`user_id`,`quest_id`),
  ADD KEY `quest_id` (`quest_id`);

--
-- Indexes for table `user_tokens`
--
ALTER TABLE `user_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_last_updated` (`last_updated`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `achievements`
--
ALTER TABLE `achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_conversations`
--
ALTER TABLE `ai_conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_usage_stats`
--
ALTER TABLE `ai_usage_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `child_parent_links`
--
ALTER TABLE `child_parent_links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `child_reports`
--
ALTER TABLE `child_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `comment_likes`
--
ALTER TABLE `comment_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `followers`
--
ALTER TABLE `followers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `game_rewards`
--
ALTER TABLE `game_rewards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_sessions`
--
ALTER TABLE `game_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT for table `learning_sessions`
--
ALTER TABLE `learning_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `likes`
--
ALTER TABLE `likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `live_chat`
--
ALTER TABLE `live_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;

--
-- AUTO_INCREMENT for table `live_participants`
--
ALTER TABLE `live_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=122;

--
-- AUTO_INCREMENT for table `live_sessions`
--
ALTER TABLE `live_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `live_session_messages`
--
ALTER TABLE `live_session_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `mini_games`
--
ALTER TABLE `mini_games`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parental_controls`
--
ALTER TABLE `parental_controls`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `post_likes`
--
ALTER TABLE `post_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `quests`
--
ALTER TABLE `quests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `rag_documents`
--
ALTER TABLE `rag_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `user_achievements`
--
ALTER TABLE `user_achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_game_progress`
--
ALTER TABLE `user_game_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_quests`
--
ALTER TABLE `user_quests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_tokens`
--
ALTER TABLE `user_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

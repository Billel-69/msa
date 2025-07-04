// backend/services/mysqlGameProgressService.js
// Service for handling MySQL game progress/session logic
const db = require('../config/db');

const mysqlGameProgressService = {
  // Insert a new game session
  async insertGameSession({ userId, gameId, sessionType = 'play', startedAt, completedAt, isCompleted, finalScore }) {
    const [result] = await db.execute(
      `INSERT INTO game_sessions (user_id, game_id, session_type, started_at, completed_at, is_completed, final_score)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, gameId, sessionType, startedAt, completedAt, isCompleted, finalScore]
    );
    return result.insertId;
  },

  // Upsert user game progress
  async upsertUserGameProgress({ userId, gameType, xpEarned, score, now, timePlayed = 0 }) {
    try {
      // Try to update first with time tracking
      const [updateResult] = await db.execute(
        `UPDATE user_game_progress SET 
          total_sessions = total_sessions + 1,
          total_xp = total_xp + ?,
          best_score = GREATEST(best_score, ?),
          total_time_played = total_time_played + ?,
          last_played = ?
        WHERE user_id = ? AND game_type = ?` ,
        [xpEarned, score, timePlayed, now, userId, gameType]
      );
      if (updateResult.affectedRows === 0) {
        // Insert if not exists
        await db.execute(
          `INSERT INTO user_game_progress (user_id, game_type, total_sessions, total_xp, best_score, total_time_played, last_played)
           VALUES (?, ?, 1, ?, ?, ?, ?)` ,
          [userId, gameType, xpEarned, score, timePlayed, now]
        );
      }
    } catch (error) {
      // Fallback if total_time_played column doesn't exist yet
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('total_time_played column not found, using fallback queries');
        // Try to update without time tracking
        const [updateResult] = await db.execute(
          `UPDATE user_game_progress SET 
            total_sessions = total_sessions + 1,
            total_xp = total_xp + ?,
            best_score = GREATEST(best_score, ?),
            last_played = ?
          WHERE user_id = ? AND game_type = ?` ,
          [xpEarned, score, now, userId, gameType]
        );
        if (updateResult.affectedRows === 0) {
          // Insert if not exists
          await db.execute(
            `INSERT INTO user_game_progress (user_id, game_type, total_sessions, total_xp, best_score, last_played)
             VALUES (?, ?, 1, ?, ?, ?)` ,
            [userId, gameType, xpEarned, score, now]
          );
        }
      } else {
        throw error;
      }
    }
  },

  // Get user progress (for /progress route)
  async getUserProgress(userId) {
    const [rows] = await db.execute(
      `SELECT ugp.*, mg.name, mg.type, mg.subject
       FROM user_game_progress ugp
       JOIN mini_games mg ON ugp.game_type = mg.type
       WHERE ugp.user_id = ?
       ORDER BY ugp.last_played DESC`,
      [userId]
    );
    return rows;
  }
};

module.exports = mysqlGameProgressService;

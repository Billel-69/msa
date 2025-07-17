const request = require('supertest');
// Mock Socket.io before requiring server
jest.mock('socket.io', () => ({
    Server: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        use: jest.fn()
    }))
}));

const app = require('../server');
const db = require('../config/db');

describe('Games API Tests', () => {
    let authToken;
    let testUserId;

    beforeAll(async () => {
        // Set up test database tables
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                user_type ENUM('student', 'parent', 'admin') DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS mini_games (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(50) NOT NULL,
                difficulty VARCHAR(50),
                subject VARCHAR(100),
                imageUrl VARCHAR(500),
                xpReward INT DEFAULT 0,
                fragmentsReward INT DEFAULT 0,
                questions JSON,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS game_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                game_id VARCHAR(36) NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                final_score INT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (game_id) REFERENCES mini_games(id) ON DELETE CASCADE
            )
        `);

        // Create test user and get auth token
        const userResponse = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

        authToken = userResponse.body.token;
        testUserId = userResponse.body.user.id;
    });

    afterAll(async () => {
        // Clean up test database
        await db.execute('DROP TABLE IF EXISTS game_sessions');
        await db.execute('DROP TABLE IF EXISTS mini_games');
        await db.execute('DROP TABLE IF EXISTS users');
        await db.end();
    });

    beforeEach(async () => {
        // Clear tables before each test
        await db.execute('DELETE FROM game_sessions');
        await db.execute('DELETE FROM mini_games');
        
        // Insert test game
        await db.execute(`
            INSERT INTO mini_games (id, name, description, type, difficulty, subject, xpReward, fragmentsReward)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, ['test-game-1', 'Test Quiz', 'A test quiz game', 'quiz', 'easy', 'math', 100, 5]);
    });

    describe('GET /api/games', () => {
        it('should get list of available games', async () => {
            const response = await request(app)
                .get('/api/games')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.games).toHaveLength(1);
            expect(response.body.games[0].name).toBe('Test Quiz');
        });

        it('should return error without authentication', async () => {
            const response = await request(app)
                .get('/api/games')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/games/:id', () => {
        it('should get specific game details', async () => {
            const response = await request(app)
                .get('/api/games/test-game-1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.game.name).toBe('Test Quiz');
            expect(response.body.game.type).toBe('quiz');
        });

        it('should return 404 for non-existent game', async () => {
            const response = await request(app)
                .get('/api/games/non-existent')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/games/session', () => {
        it('should create a new game session', async () => {
            const sessionData = {
                game_id: 'test-game-1',
                session_type: 'play'
            };

            const response = await request(app)
                .post('/api/games/session')
                .set('Authorization', `Bearer ${authToken}`)
                .send(sessionData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.session.game_id).toBe('test-game-1');
            expect(response.body.session.user_id).toBe(testUserId);
        });

        it('should return error for invalid game_id', async () => {
            const sessionData = {
                game_id: 'invalid-game',
                session_type: 'play'
            };

            const response = await request(app)
                .post('/api/games/session')
                .set('Authorization', `Bearer ${authToken}`)
                .send(sessionData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/games/session/:id', () => {
        let sessionId;

        beforeEach(async () => {
            // Create a test session
            const sessionResponse = await request(app)
                .post('/api/games/session')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    game_id: 'test-game-1',
                    session_type: 'play'
                });

            sessionId = sessionResponse.body.session.id;
        });

        it('should update game session with completion', async () => {
            const updateData = {
                is_completed: true,
                final_score: 850
            };

            const response = await request(app)
                .put(`/api/games/session/${sessionId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.session.is_completed).toBe(true);
            expect(response.body.session.final_score).toBe(850);
        });

        it('should return error for non-existent session', async () => {
            const updateData = {
                is_completed: true,
                final_score: 850
            };

            const response = await request(app)
                .put('/api/games/session/9999')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should prevent updating other user sessions', async () => {
            // Create another user
            const otherUserResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'otheruser',
                    email: 'other@example.com',
                    password: 'password123'
                });

            const otherToken = otherUserResponse.body.token;

            const updateData = {
                is_completed: true,
                final_score: 850
            };

            const response = await request(app)
                .put(`/api/games/session/${sessionId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
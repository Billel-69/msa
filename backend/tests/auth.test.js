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

describe('Authentication Tests', () => {
    beforeAll(async () => {
        // Set up test database
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
    });

    afterAll(async () => {
        // Clean up test database
        await db.execute('DROP TABLE IF EXISTS users');
        await db.end();
    });

    beforeEach(async () => {
        // Clear users table before each test
        await db.execute('DELETE FROM users');
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                user_type: 'student'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.user.username).toBe('testuser');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.token).toBeDefined();
        });

        it('should return error for duplicate username', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // First registration
            await request(app)
                .post('/api/auth/register')
                .send(userData);

            // Second registration with same username
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test2@example.com',
                    password: 'password123'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        it('should return error for invalid email format', async () => {
            const userData = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });
        });

        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.username).toBe('testuser');
        });

        it('should return error for invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid');
        });

        it('should return error for non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
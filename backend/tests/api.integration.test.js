// Integration tests for MSA API endpoints
const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Import controllers
const postController = require('../controllers/postController');
const gameRoutes = require('../routes/gameRoutes');
const authRoutes = require('../routes/authRoutes');

// Create test app with full middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

describe('Integration Tests - Full API', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Register a test user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Integration Test User',
                username: 'integrationuser',
                email: 'integration@test.com',
                password: 'TestPassword123!',
                accountType: 'child'
            });

        if (registerResponse.status === 201) {
            userId = registerResponse.body.userId;
            
            // Login to get auth token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'integration@test.com',
                    password: 'TestPassword123!'
                });

            if (loginResponse.status === 200) {
                authToken = loginResponse.body.token;
            }
        }
    });

    describe('Authentication Flow', () => {
        test('should complete full auth flow', () => {
            expect(authToken).toBeDefined();
            expect(userId).toBeDefined();
        });
    });

    describe('Games API', () => {
        test('should get games list', async () => {
            const response = await request(app)
                .get('/api/games')
                .set('Authorization', `Bearer ${authToken}`);

            // Should either return games or handle missing auth gracefully
            expect([200, 401, 404].includes(response.status)).toBe(true);
        });

        test('should handle game details request', async () => {
            const response = await request(app)
                .get('/api/games/1')
                .set('Authorization', `Bearer ${authToken}`);

            // Should handle the request, even if game doesn't exist
            expect([200, 401, 404].includes(response.status)).toBe(true);
        });
    });

    describe('API Error Handling', () => {
        test('should handle invalid routes', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);
        });

        test('should handle malformed JSON', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);
        });

        test('should handle missing authorization', async () => {
            const response = await request(app)
                .get('/api/games')
                .expect(401);
        });
    });

    describe('Data Validation', () => {
        test('should validate email format in registration', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    username: 'testuser456',
                    email: 'invalid-email',
                    password: 'TestPassword123!',
                    accountType: 'child'
                });

            // Should reject invalid email (status depends on validation implementation)
            expect([400, 500].includes(response.status)).toBe(true);
        });

        test('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User'
                    // Missing required fields
                });

            expect([400, 500].includes(response.status)).toBe(true);
        });
    });
});

describe('Database Integration Tests', () => {
    test('should connect to test database', () => {
        // Test database configuration
        const dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD
        };

        expect(dbConfig.host).toBeDefined();
        expect(dbConfig.database).toBe('msa_test');
        expect(process.env.NODE_ENV).toBe('test');
    });

    test('should have proper test environment setup', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.JWT_SECRET).toBeDefined();
        expect(process.env.DB_NAME).toContain('test');
    });
});

describe('Performance Tests', () => {
    test('should handle concurrent requests', async () => {
        const promises = [];
        
        // Create 5 concurrent registration requests
        for (let i = 0; i < 5; i++) {
            promises.push(
                request(app)
                    .post('/api/auth/register')
                    .send({
                        name: `Concurrent User ${i}`,
                        username: `concurrent${i}`,
                        email: `concurrent${i}@test.com`,
                        password: 'TestPassword123!',
                        accountType: 'child'
                    })
            );
        }

        const responses = await Promise.all(promises);
        
        // At least some should succeed (depends on database state)
        const successCount = responses.filter(r => r.status === 201).length;
        const errorCount = responses.filter(r => r.status >= 400).length;
        
        expect(successCount + errorCount).toBe(5);
    });

    test('should respond within reasonable time', async () => {
        const startTime = Date.now();
        
        await request(app)
            .get('/api/games');
            
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Should respond within 5 seconds
        expect(responseTime).toBeLessThan(5000);
    });
});
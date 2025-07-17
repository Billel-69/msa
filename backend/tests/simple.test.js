// Real API tests for MSA backend
const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import your app/server components
const authController = require('../controllers/authController');
const userModel = require('../models/userModel');

// Create test app
const app = express();
app.use(express.json());

// Add auth routes for testing
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

describe('Authentication API Tests', () => {
    let testUser = {
        name: 'Test User',
        username: 'testuser123',
        email: 'test@example.com',
        password: 'TestPassword123!',
        accountType: 'child'
    };

    describe('POST /api/auth/register', () => {
        test('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Inscription réussie');
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('accountType', 'child');
        });

        test('should reject registration with invalid account type', async () => {
            const invalidUser = { ...testUser, accountType: 'invalid', email: 'test2@example.com' };
            
            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidUser)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Type de compte invalide');
        });

        test('should reject registration with missing fields', async () => {
            const incompleteUser = { name: 'Test', email: 'test3@example.com' };
            
            await request(app)
                .post('/api/auth/register')
                .send(incompleteUser)
                .expect(500); // Should handle missing fields gracefully
        });
    });

    describe('POST /api/auth/login', () => {
        test('should login with valid credentials', async () => {
            // First register a user
            await request(app)
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    email: 'login@example.com',
                    username: 'loginuser'
                });

            // Then try to login
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'TestPassword123!'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
        });

        test('should reject login with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });
});

describe('Utility Functions Tests', () => {
    test('should hash passwords correctly', async () => {
        const password = 'testpassword123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        
        const isValid = await bcrypt.compare(password, hashedPassword);
        expect(isValid).toBe(true);
    });

    test('should create and verify JWT tokens', () => {
        const payload = { id: 123, username: 'testuser' };
        const secret = process.env.JWT_SECRET || 'test_secret';
        
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });
        expect(token).toBeDefined();
        
        const decoded = jwt.verify(token, secret);
        expect(decoded.id).toBe(123);
        expect(decoded.username).toBe('testuser');
    });
});

describe('Database Connection Tests', () => {
    test('should test database configuration', () => {
        // Test that environment variables are set correctly
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.JWT_SECRET).toBeDefined();
        expect(process.env.DB_NAME).toBeDefined();
    });
});
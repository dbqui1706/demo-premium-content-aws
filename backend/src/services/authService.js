import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const authService = {
    // Hash password
    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    },

    // Compare password
    comparePassword: async (password, hash) => {
        return bcrypt.compare(password, hash);
    },

    // Generate JWT token
    generateToken: (user) => {
        const payload = {
            id: user.id,
            email: user.email,
            tier: user.tier
        };

        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    },

    // Verify JWT token
    verifyToken: (token) => {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    },

    // Register new user
    register: async (email, password, tier = 'free') => {
        // Check if user already exists
        const existingUser = User.findByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Validate tier
        if (!['free', 'premium'].includes(tier)) {
            throw new Error('Invalid tier. Must be "free" or "premium"');
        }

        // Hash password and create user
        const passwordHash = await authService.hashPassword(password);
        const userId = User.create(email, passwordHash, tier);

        console.log('userId after create:', userId, typeof userId);

        // Get created user
        const user = User.findById(userId);
        console.log('user from findById:', user);

        // Generate token
        const token = authService.generateToken(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                tier: user.tier
            },
            token
        };
    },

    // Login user
    login: async (email, password) => {
        // Find user
        const user = User.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await authService.comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Generate token
        const token = authService.generateToken(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                tier: user.tier
            },
            token
        };
    },

    // Get user from token
    getUserFromToken: (token) => {
        const decoded = authService.verifyToken(token);
        const user = User.findById(decoded.id);

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            tier: user.tier
        };
    }
};

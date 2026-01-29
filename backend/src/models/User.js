import db from '../config/database.js';

export const User = {
    // Create new user
    create: (email, passwordHash, tier = 'free') => {
        const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, tier)
      VALUES (?, ?, ?)
    `);
        const result = stmt.run(email, passwordHash, tier);
        return result.lastInsertRowid;
    },

    // Find user by email
    findByEmail: (email) => {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    },

    // Find user by ID
    findById: (id) => {
        const stmt = db.prepare('SELECT id, email, tier, created_at FROM users WHERE id = ?');
        return stmt.get(id);
    },

    // Update user tier
    updateTier: (id, tier) => {
        const stmt = db.prepare('UPDATE users SET tier = ? WHERE id = ?');
        return stmt.run(tier, id);
    },

    // Get all users (admin only)
    findAll: () => {
        const stmt = db.prepare('SELECT id, email, tier, created_at FROM users');
        return stmt.all();
    }
};

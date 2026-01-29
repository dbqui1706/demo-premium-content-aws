import db from '../config/database.js';

export const Content = {
    // Create new content
    create: (contentData) => {
        const { title, description, type, tier, s3_key, thumbnail, duration, file_size } = contentData;
        const stmt = db.prepare(`
      INSERT INTO content (title, description, type, tier, s3_key, thumbnail, duration, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(title, description, type, tier, s3_key, thumbnail, duration, file_size);
        return result.lastInsertRowid;
    },

    // Find content by ID
    findById: (id) => {
        const stmt = db.prepare('SELECT * FROM content WHERE id = ?');
        return stmt.get(id);
    },

    // Get all content
    findAll: () => {
        const stmt = db.prepare('SELECT * FROM content ORDER BY created_at DESC');
        return stmt.all();
    },

    // Get content by tier
    findByTier: (tier) => {
        const stmt = db.prepare('SELECT * FROM content WHERE tier = ? ORDER BY created_at DESC');
        return stmt.all(tier);
    },

    // Get content accessible by user tier
    findAccessibleContent: (userTier) => {
        // Premium users can access both free and premium content
        // Free users can only access free content
        if (userTier === 'premium') {
            return Content.findAll();
        } else {
            return Content.findByTier('free');
        }
    },

    // Log content access
    logAccess: (userId, contentId) => {
        const stmt = db.prepare(`
      INSERT INTO access_logs (user_id, content_id)
      VALUES (?, ?)
    `);
        return stmt.run(userId, contentId);
    }
};

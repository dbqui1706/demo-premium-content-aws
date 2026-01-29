import express from 'express';
import { contentService } from '../services/contentService.js';
import { signedUrlService } from '../services/signedUrlService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/content - Get all content (public metadata)
router.get('/', async (req, res) => {
    try {
        const userTier = req.query.tier || 'free'; // Default to free if not authenticated
        const content = contentService.getAccessibleContent(userTier);

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/content/stats - Get content statistics
router.get('/stats', (req, res) => {
    try {
        const stats = contentService.getContentStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/content/:id - Get content metadata by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const content = contentService.getContentById(id);

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/content/:id/access - Get signed URL for content (requires auth)
router.post('/:id/access', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Get content
        const content = contentService.getContentById(id);

        // Check if user can access this content
        if (!contentService.canUserAccessContent(user.tier, content.tier)) {
            return res.status(403).json({
                success: false,
                error: `This content requires ${content.tier} tier. Your tier: ${user.tier}`
            });
        }

        // Generate signed URL
        const signedUrl = signedUrlService.generateSignedUrl(content.s3_key);

        // Log access
        contentService.logContentAccess(user.id, content.id);

        res.json({
            success: true,
            data: {
                signedUrl,
                content: {
                    id: content.id,
                    title: content.title,
                    type: content.type,
                    tier: content.tier
                },
                expiresIn: parseInt(process.env.SIGNED_URL_EXPIRATION) || 900
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

export default router;

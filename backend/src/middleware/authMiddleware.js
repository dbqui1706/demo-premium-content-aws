import { authService } from '../services/authService.js';

export const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token and get user
        const user = authService.getUserFromToken(token);

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: error.message || 'Invalid token'
        });
    }
};

// Middleware to check user tier
export const requireTier = (requiredTier) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Premium users can access everything
        if (req.user.tier === 'premium') {
            return next();
        }

        // Check if user has required tier
        if (req.user.tier !== requiredTier) {
            return res.status(403).json({
                success: false,
                error: `This content requires ${requiredTier} tier`
            });
        }

        next();
    };
};

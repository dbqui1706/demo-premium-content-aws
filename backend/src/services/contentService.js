import { Content } from '../models/Content.js';

export const contentService = {
    // Get all content
    getAllContent: () => {
        return Content.findAll();
    },

    // Get content by ID
    getContentById: (id) => {
        const content = Content.findById(id);
        if (!content) {
            throw new Error('Content not found');
        }
        return content;
    },

    // Get content accessible by user
    getAccessibleContent: (userTier) => {
        return Content.findAccessibleContent(userTier);
    },

    // Check if user can access content
    canUserAccessContent: (userTier, contentTier) => {
        // Premium users can access everything
        if (userTier === 'premium') {
            return true;
        }
        // Free users can only access free content
        return contentTier === 'free';
    },

    // Log content access
    logContentAccess: (userId, contentId) => {
        return Content.logAccess(userId, contentId);
    },

    // Get content statistics (optional)
    getContentStats: () => {
        const allContent = Content.findAll();
        return {
            total: allContent.length,
            free: allContent.filter(c => c.tier === 'free').length,
            premium: allContent.filter(c => c.tier === 'premium').length,
            byType: {
                video: allContent.filter(c => c.type === 'video').length,
                pdf: allContent.filter(c => c.type === 'pdf').length,
                image: allContent.filter(c => c.type === 'image').length
            }
        };
    }
};

/**
 * Lambda@Edge Origin Request Function
 * 
 * Executes AFTER cache miss, BEFORE forwarding to S3
 * 
 * Purpose:
 * - Read custom headers from viewer request
 * - Add logging/analytics headers
 * - Implement additional business logic
 * - Can modify request to origin
 */

export const handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    console.log('Origin Request - URI:', request.uri);

    // Read custom headers from viewer request
    const userId = headers['x-user-id'] ? headers['x-user-id'][0].value : 'anonymous';
    const userTier = headers['x-user-tier'] ? headers['x-user-tier'][0].value : 'free';
    const userEmail = headers['x-user-email'] ? headers['x-user-email'][0].value : 'unknown';

    console.log('User Info - ID:', userId, 'Tier:', userTier, 'Email:', userEmail);

    // Add timestamp header for analytics
    request.headers['x-request-timestamp'] = [{
        key: 'X-Request-Timestamp',
        value: new Date().toISOString()
    }];

    // Add request ID for tracking
    request.headers['x-request-id'] = [{
        key: 'X-Request-Id',
        value: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }];

    // Add content tier header
    const contentTier = request.uri.startsWith('/premium/') ? 'premium' : 'free';
    request.headers['x-content-tier'] = [{
        key: 'X-Content-Tier',
        value: contentTier
    }];

    // Optional: Add custom metadata for S3 or logging
    request.headers['x-access-metadata'] = [{
        key: 'X-Access-Metadata',
        value: JSON.stringify({
            userId,
            userTier,
            contentTier,
            timestamp: new Date().toISOString()
        })
    }];

    console.log('Origin request processed - forwarding to S3');

    // Forward modified request to origin (S3)
    return request;
};

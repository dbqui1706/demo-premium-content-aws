/**
 * Lambda@Edge Viewer Request Function
 * 
 * Executes BEFORE CloudFront checks its cache
 * 
 * Purpose:
 * - Extract and validate JWT from request
 * - Check user tier from JWT payload
 * - Block unauthorized access to premium content
 * - Add custom headers for downstream processing
 */

import { extractToken, validateJWT } from '../shared/jwtValidator.js';

export const handler = async (event) => {
    const request = event.Records[0].cf.request;
    const uri = request.uri;

    console.log('Viewer Request - URI:', uri);

    // Allow access to free content without authentication
    if (uri.startsWith('/free/')) {
        console.log('Free content - allowing access');
        return request;
    }

    // Premium content requires authentication
    if (uri.startsWith('/premium/')) {
        console.log('Premium content - checking authentication');

        // Extract JWT token
        const token = extractToken(request);

        if (!token) {
            console.log('No token provided - blocking access');
            return {
                status: '401',
                statusDescription: 'Unauthorized',
                headers: {
                    'content-type': [{
                        key: 'Content-Type',
                        value: 'application/json'
                    }],
                    'cache-control': [{
                        key: 'Cache-Control',
                        value: 'no-store'
                    }]
                },
                body: JSON.stringify({
                    error: 'Authentication required',
                    message: 'Please provide a valid JWT token'
                })
            };
        }

        // Validate JWT
        const validation = validateJWT(token);

        if (!validation.valid) {
            console.log('Invalid token:', validation.error);
            return {
                status: '401',
                statusDescription: 'Unauthorized',
                headers: {
                    'content-type': [{
                        key: 'Content-Type',
                        value: 'application/json'
                    }],
                    'cache-control': [{
                        key: 'Cache-Control',
                        value: 'no-store'
                    }]
                },
                body: JSON.stringify({
                    error: 'Invalid token',
                    message: validation.error
                })
            };
        }

        const { payload } = validation;

        // Check user tier for premium content
        if (payload.tier !== 'premium') {
            console.log('Insufficient tier:', payload.tier);
            return {
                status: '403',
                statusDescription: 'Forbidden',
                headers: {
                    'content-type': [{
                        key: 'Content-Type',
                        value: 'application/json'
                    }],
                    'cache-control': [{
                        key: 'Cache-Control',
                        value: 'no-store'
                    }]
                },
                body: JSON.stringify({
                    error: 'Insufficient permissions',
                    message: 'This content requires premium tier',
                    userTier: payload.tier,
                    requiredTier: 'premium'
                })
            };
        }

        // Add custom headers for downstream processing
        request.headers['x-user-id'] = [{
            key: 'X-User-Id',
            value: String(payload.id)
        }];

        request.headers['x-user-tier'] = [{
            key: 'X-User-Tier',
            value: payload.tier
        }];

        request.headers['x-user-email'] = [{
            key: 'X-User-Email',
            value: payload.email || 'unknown'
        }];

        console.log('Authentication successful - User:', payload.id, 'Tier:', payload.tier);
    }

    // Allow request to proceed
    return request;
};

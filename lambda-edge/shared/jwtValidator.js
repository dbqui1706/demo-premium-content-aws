/**
 * Lightweight JWT Validator for Lambda@Edge
 * 
 * IMPORTANT: Lambda@Edge has strict size limits (1MB)
 * This implementation uses no external dependencies
 */

// Base64 URL decode
function base64UrlDecode(str) {
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    while (str.length % 4) {
        str += '=';
    }

    // Decode base64
    const decoded = Buffer.from(str, 'base64').toString('utf8');
    return JSON.parse(decoded);
}

// Verify JWT structure and decode payload
export function decodeJWT(token) {
    try {
        const parts = token.split('.');

        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const [headerB64, payloadB64, signature] = parts;

        // Decode header and payload
        const header = base64UrlDecode(headerB64);
        const payload = base64UrlDecode(payloadB64);

        return {
            header,
            payload,
            signature,
            valid: true
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

// Check if JWT is expired
export function isTokenExpired(payload) {
    if (!payload.exp) {
        return false; // No expiration set
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime > payload.exp;
}

// Validate JWT (basic validation without signature verification)
// Note: For production, you should verify signature using public key
export function validateJWT(token) {
    const decoded = decodeJWT(token);

    if (!decoded.valid) {
        return {
            valid: false,
            error: decoded.error
        };
    }

    // Check expiration
    if (isTokenExpired(decoded.payload)) {
        return {
            valid: false,
            error: 'Token expired'
        };
    }

    // Check required fields
    if (!decoded.payload.id || !decoded.payload.tier) {
        return {
            valid: false,
            error: 'Invalid token payload'
        };
    }

    return {
        valid: true,
        payload: decoded.payload
    };
}

// Extract token from request
export function extractToken(request) {
    const headers = request.headers;

    // Try Authorization header first
    if (headers.authorization && headers.authorization[0]) {
        const authHeader = headers.authorization[0].value;
        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
    }

    // Try query string as fallback
    if (request.querystring) {
        const params = new URLSearchParams(request.querystring);
        const token = params.get('token');
        if (token) {
            return token;
        }
    }

    return null;
}

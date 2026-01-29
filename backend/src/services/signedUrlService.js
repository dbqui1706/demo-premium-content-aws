import AWS from 'aws-sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const cloudfront = new AWS.CloudFront.Signer(
    process.env.CLOUDFRONT_KEY_PAIR_ID,
    process.env.CLOUDFRONT_PRIVATE_KEY_PATH
        ? readFileSync(process.env.CLOUDFRONT_PRIVATE_KEY_PATH, 'utf8')
        : null
);

export const signedUrlService = {
    // Generate CloudFront signed URL
    generateSignedUrl: (s3Key, expirationSeconds = null) => {
        const expiration = expirationSeconds || parseInt(process.env.SIGNED_URL_EXPIRATION) || 900; // Default 15 minutes
        const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;

        if (!cloudfrontDomain) {
            throw new Error('CLOUDFRONT_DOMAIN not configured');
        }

        if (!process.env.CLOUDFRONT_KEY_PAIR_ID || !process.env.CLOUDFRONT_PRIVATE_KEY_PATH) {
            // Fallback for development - return unsigned URL
            console.warn('⚠️  CloudFront signing not configured. Returning unsigned URL.');
            return `https://${cloudfrontDomain}/${s3Key}`;
        }

        const url = `https://${cloudfrontDomain}/${s3Key}`;
        const policy = JSON.stringify({
            Statement: [
                {
                    Resource: url,
                    Condition: {
                        DateLessThan: {
                            'AWS:EpochTime': Math.floor(Date.now() / 1000) + expiration
                        }
                    }
                }
            ]
        });

        try {
            const signedUrl = cloudfront.getSignedUrl({
                url,
                expires: Math.floor(Date.now() / 1000) + expiration,
                policy
            });

            return signedUrl;
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Failed to generate signed URL');
        }
    },

    // Generate signed URL with custom policy (advanced)
    generateSignedUrlWithPolicy: (s3Key, options = {}) => {
        const {
            expirationSeconds = 900,
            ipAddress = null,
            dateGreaterThan = null
        } = options;

        const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
        const url = `https://${cloudfrontDomain}/${s3Key}`;

        const conditions = {
            DateLessThan: {
                'AWS:EpochTime': Math.floor(Date.now() / 1000) + expirationSeconds
            }
        };

        // Add IP restriction if provided
        if (ipAddress) {
            conditions.IpAddress = {
                'AWS:SourceIp': ipAddress
            };
        }

        // Add start time if provided
        if (dateGreaterThan) {
            conditions.DateGreaterThan = {
                'AWS:EpochTime': dateGreaterThan
            };
        }

        const policy = JSON.stringify({
            Statement: [
                {
                    Resource: url,
                    Condition: conditions
                }
            ]
        });

        try {
            const signedUrl = cloudfront.getSignedUrl({
                url,
                policy
            });

            return signedUrl;
        } catch (error) {
            console.error('Error generating signed URL with policy:', error);
            throw new Error('Failed to generate signed URL');
        }
    }
};

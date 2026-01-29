import { unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedDatabase = async () => {
    console.log('🌱 Seeding database...\n');

    try {
        const dbPath = join(__dirname, '../../database/app.db');
        if (existsSync(dbPath)) {
            unlinkSync(dbPath);
            console.log('🗑️  Deleted existing database file\n');
        }

        const { default: db } = await import('../config/database.js');

        console.log('👥 Creating demo users...');

        const { authService } = await import('../services/authService.js');
        const { Content } = await import('../models/Content.js');

        const freeUser = await authService.register('free@demo.com', 'password123', 'free');
        console.log(`   ✓ Free user: free@demo.com (password: password123)`);

        const premiumUser = await authService.register('premium@demo.com', 'password123', 'premium');
        console.log(`   ✓ Premium user: premium@demo.com (password: password123)\n`);

        // Seed content
        console.log('📦 Creating content...');

        // Free content
        Content.create({
            title: 'Introduction to Web Development',
            description: 'Learn the basics of HTML, CSS, and JavaScript',
            type: 'video',
            tier: 'free',
            s3_key: 'free/intro-web-dev.mp4',
            thumbnail: 'free/intro-web-dev-thumb.jpg',
            duration: 1200,
            file_size: 52428800
        });
        console.log('   ✓ Free video: Introduction to Web Development');

        Content.create({
            title: 'Getting Started Guide',
            description: 'A comprehensive guide for beginners',
            type: 'pdf',
            tier: 'free',
            s3_key: 'free/getting-started.pdf',
            thumbnail: 'free/getting-started-thumb.jpg',
            duration: null,
            file_size: 2097152
        });
        console.log('   ✓ Free PDF: Getting Started Guide');

        Content.create({
            title: 'Sample Architecture Diagram',
            description: 'System architecture overview',
            type: 'image',
            tier: 'free',
            s3_key: 'free/architecture-diagram.png',
            thumbnail: 'free/architecture-diagram-thumb.jpg',
            duration: null,
            file_size: 524288
        });
        console.log('   ✓ Free image: Sample Architecture Diagram\n');

        // Premium content
        Content.create({
            title: 'Advanced Lambda@Edge Patterns',
            description: 'Deep dive into Lambda@Edge optimization and best practices',
            type: 'video',
            tier: 'premium',
            s3_key: 'premium/advanced-lambda-edge.mp4',
            thumbnail: 'premium/advanced-lambda-edge-thumb.jpg',
            duration: 3600,
            file_size: 157286400
        });
        console.log('   ✓ Premium video: Advanced Lambda@Edge Patterns');

        Content.create({
            title: 'AWS Security Best Practices',
            description: 'Complete guide to securing your AWS infrastructure',
            type: 'pdf',
            tier: 'premium',
            s3_key: 'premium/aws-security-guide.pdf',
            thumbnail: 'premium/aws-security-guide-thumb.jpg',
            duration: null,
            file_size: 5242880
        });
        console.log('   ✓ Premium PDF: AWS Security Best Practices');

        Content.create({
            title: 'CloudFront Architecture Blueprint',
            description: 'Production-ready CloudFront setup with Lambda@Edge',
            type: 'image',
            tier: 'premium',
            s3_key: 'premium/cloudfront-blueprint.png',
            thumbnail: 'premium/cloudfront-blueprint-thumb.jpg',
            duration: null,
            file_size: 1048576
        });
        console.log('   ✓ Premium image: CloudFront Architecture Blueprint');

        Content.create({
            title: 'Serverless Masterclass',
            description: 'Complete serverless architecture course',
            type: 'video',
            tier: 'premium',
            s3_key: 'premium/serverless-masterclass.mp4',
            thumbnail: 'premium/serverless-masterclass-thumb.jpg',
            duration: 7200,
            file_size: 314572800
        });
        console.log('   ✓ Premium video: Serverless Masterclass\n');

        console.log('✅ Database seeded successfully!\n');
        console.log('📊 Summary:');
        console.log('   - Users: 2 (1 free, 1 premium)');
        console.log('   - Content: 7 (3 free, 4 premium)');
        console.log('   - Types: 4 videos, 2 PDFs, 2 images\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seed
seedDatabase();
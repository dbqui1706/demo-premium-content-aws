# Manual AWS Setup Guide

This guide walks you through setting up the AWS infrastructure manually to understand each component before using Infrastructure as Code.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- CloudFront key pair for signed URLs
- Sample content files ready for upload

## Table of Contents

1. [Create S3 Bucket](#1-create-s3-bucket)
2. [Upload Sample Content](#2-upload-sample-content)
3. [Create CloudFront Key Pair](#3-create-cloudfront-key-pair)
4. [Create CloudFront Distribution](#4-create-cloudfront-distribution)
5. [Deploy Lambda@Edge Functions](#5-deploy-lambdaedge-functions)
6. [Attach Lambda Functions to CloudFront](#6-attach-lambda-functions-to-cloudfront)
7. [Configure Backend](#7-configure-backend)
8. [Test the Setup](#8-test-the-setup)

---

## 1. Create S3 Bucket

### Via AWS Console

1. Go to **S3 Console** → Click **Create bucket**
2. **Bucket name**: `premium-content-demo-bucket-<your-unique-id>`
3. **Region**: `us-east-1` (recommended for Lambda@Edge)
4. **Block Public Access**: Keep all enabled (CloudFront will access via OAI)
5. Click **Create bucket**

### Via AWS CLI

```bash
aws s3 mb s3://premium-content-demo-bucket-<your-unique-id> --region us-east-1
```

### Create Folder Structure

```bash
aws s3api put-object --bucket premium-content-demo-bucket-<your-unique-id> --key free/
aws s3api put-object --bucket premium-content-demo-bucket-<your-unique-id> --key premium/
```

---

## 2. Upload Sample Content

### Prepare Sample Files

Create or download sample files:
- **Free content**: `free/intro-web-dev.mp4`, `free/getting-started.pdf`, `free/architecture-diagram.png`
- **Premium content**: `premium/advanced-lambda-edge.mp4`, `premium/aws-security-guide.pdf`, `premium/cloudfront-blueprint.png`

### Upload via AWS CLI

```bash
# Upload free content
aws s3 cp sample-content/free/ s3://premium-content-demo-bucket-<your-unique-id>/free/ --recursive

# Upload premium content
aws s3 cp sample-content/premium/ s3://premium-content-demo-bucket-<your-unique-id>/premium/ --recursive
```

### Set Bucket Policy (CloudFront Access Only)

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity <OAI-ID>"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::premium-content-demo-bucket-<your-unique-id>/*"
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy --bucket premium-content-demo-bucket-<your-unique-id> --policy file://bucket-policy.json
```

---

## 3. Create CloudFront Key Pair

CloudFront signed URLs require a key pair associated with your AWS account.

### Generate Key Pair

1. **Sign in as root user** (key pairs can only be created by root)
2. Go to **Account** → **Security Credentials**
3. Scroll to **CloudFront key pairs**
4. Click **Create New Key Pair**
5. Download both:
   - **Private key** (`pk-<KEY_PAIR_ID>.pem`)
   - **Public key** (automatically uploaded to AWS)
6. **Save the Key Pair ID** - you'll need this

### Store Private Key Securely

```bash
# Create keys directory in backend
mkdir -p backend/keys

# Move private key
mv ~/Downloads/pk-<KEY_PAIR_ID>.pem backend/keys/cloudfront-private-key.pem

# Set restrictive permissions
chmod 400 backend/keys/cloudfront-private-key.pem
```

⚠️ **Important**: Never commit private keys to version control. Add to `.gitignore`.

---

## 4. Create CloudFront Distribution

### Via AWS Console

1. Go to **CloudFront Console** → Click **Create Distribution**

2. **Origin Settings**:
   - **Origin Domain**: Select your S3 bucket
   - **Origin Path**: Leave empty
   - **Origin Access**: **Origin Access Identity (OAI)**
   - **Create new OAI**: Yes
   - **Bucket Policy**: Update automatically

3. **Default Cache Behavior**:
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS
   - **Cache Policy**: CachingOptimized
   - **Origin Request Policy**: CORS-S3Origin

4. **Distribution Settings**:
   - **Price Class**: Use all edge locations (or choose based on your needs)
   - **Alternate Domain Names (CNAMEs)**: Leave empty for now
   - **SSL Certificate**: Default CloudFront certificate

5. Click **Create Distribution**

6. **Note the Distribution Domain Name**: `d1234abcd.cloudfront.net`

### Via AWS CLI

```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

---

## 5. Deploy Lambda@Edge Functions

Lambda@Edge functions must be deployed to **us-east-1** region.

### Create IAM Role for Lambda@Edge

Create `lambda-edge-role.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "edgelambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create role:
```bash
aws iam create-role \
  --role-name lambda-edge-execution-role \
  --assume-role-policy-document file://lambda-edge-role.json

aws iam attach-role-policy \
  --role-name lambda-edge-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### Deploy Viewer Request Lambda

```bash
cd lambda-edge/viewer-request

# Create deployment package
zip -r function.zip index.js package.json ../shared/

# Create Lambda function
aws lambda create-function \
  --function-name premium-content-viewer-request \
  --runtime nodejs18.x \
  --role arn:aws:iam::<ACCOUNT_ID>:role/lambda-edge-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --region us-east-1 \
  --publish

# Note the Version ARN - you'll need this
```

### Deploy Origin Request Lambda

```bash
cd ../origin-request

# Create deployment package
zip -r function.zip index.js package.json ../shared/

# Create Lambda function
aws lambda create-function \
  --function-name premium-content-origin-request \
  --runtime nodejs18.x \
  --role arn:aws:iam::<ACCOUNT_ID>:role/lambda-edge-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --region us-east-1 \
  --publish

# Note the Version ARN
```

---

## 6. Attach Lambda Functions to CloudFront

### Get Distribution Config

```bash
# Get distribution ID
aws cloudfront list-distributions --query "DistributionList.Items[0].Id" --output text

# Get current config
aws cloudfront get-distribution-config --id <DISTRIBUTION_ID> > dist-config.json
```

### Update Distribution Config

Edit `dist-config.json` and add Lambda associations to `DefaultCacheBehavior`:

```json
{
  "DefaultCacheBehavior": {
    "LambdaFunctionAssociations": {
      "Quantity": 2,
      "Items": [
        {
          "LambdaFunctionARN": "arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:premium-content-viewer-request:1",
          "EventType": "viewer-request",
          "IncludeBody": false
        },
        {
          "LambdaFunctionARN": "arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:premium-content-origin-request:1",
          "EventType": "origin-request",
          "IncludeBody": false
        }
      ]
    }
  }
}
```

### Apply Updated Config

```bash
aws cloudfront update-distribution \
  --id <DISTRIBUTION_ID> \
  --distribution-config file://dist-config.json \
  --if-match <ETAG>
```

⏳ **Wait 15-30 minutes** for Lambda@Edge to propagate globally.

---

## 7. Configure Backend

### Update .env File

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>

# CloudFront Configuration
CLOUDFRONT_DOMAIN=d1234abcd.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=<your-key-pair-id>
CLOUDFRONT_PRIVATE_KEY_PATH=./keys/cloudfront-private-key.pem

# S3 Configuration
S3_BUCKET_NAME=premium-content-demo-bucket-<your-unique-id>
```

### Seed Database

```bash
npm run seed
```

### Start Backend

```bash
npm run dev
```

---

## 8. Test the Setup

### Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","tier":"premium"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test CloudFront + Lambda@Edge

```bash
# Test free content (should work without auth)
curl https://d1234abcd.cloudfront.net/free/intro-web-dev.mp4

# Test premium content without JWT (should be blocked)
curl https://d1234abcd.cloudfront.net/premium/advanced-lambda-edge.mp4

# Test premium content with JWT (should work)
curl https://d1234abcd.cloudfront.net/premium/advanced-lambda-edge.mp4 \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Test Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` and:
1. Login as premium user
2. Browse gallery
3. Click on premium content
4. Verify signed URL is generated
5. Verify content is delivered

---

## Verification Checklist

- [ ] S3 bucket created with free/ and premium/ folders
- [ ] Sample content uploaded
- [ ] CloudFront distribution created and deployed
- [ ] CloudFront key pair generated and stored securely
- [ ] Lambda@Edge functions deployed to us-east-1
- [ ] Lambda functions attached to CloudFront distribution
- [ ] Backend .env configured with CloudFront domain and key pair
- [ ] Database seeded with demo users
- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 5173
- [ ] Free content accessible without authentication
- [ ] Premium content blocked for free users
- [ ] Premium content accessible for premium users with signed URLs

---

## Next Steps

- Review [API Documentation](API_DOCUMENTATION.md)
- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Explore [Architecture Details](ARCHITECTURE.md)
- Consider implementing [Infrastructure as Code](../infrastructure/cdk/README.md)

---

## Cleanup

To avoid AWS charges:

```bash
# Delete CloudFront distribution (must disable first)
aws cloudfront delete-distribution --id <DISTRIBUTION_ID>

# Delete Lambda functions
aws lambda delete-function --function-name premium-content-viewer-request --region us-east-1
aws lambda delete-function --function-name premium-content-origin-request --region us-east-1

# Empty and delete S3 bucket
aws s3 rm s3://premium-content-demo-bucket-<your-unique-id> --recursive
aws s3 rb s3://premium-content-demo-bucket-<your-unique-id>
```

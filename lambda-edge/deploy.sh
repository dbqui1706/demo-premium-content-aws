#!/bin/bash

# Lambda@Edge Deployment Script
# This script packages and deploys Lambda@Edge functions to AWS

set -e

echo "🚀 Lambda@Edge Deployment Script"
echo "=================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Function to deploy Lambda@Edge
deploy_lambda() {
    local FUNCTION_NAME=$1
    local FUNCTION_DIR=$2
    local DESCRIPTION=$3
    
    echo "📦 Deploying $FUNCTION_NAME..."
    
    cd "$FUNCTION_DIR"
    
    # Create deployment package
    echo "   - Creating deployment package..."
    zip -r function.zip index.js package.json ../shared/ -q
    
    # Check if function exists
    if aws lambda get-function --function-name "$FUNCTION_NAME" --region us-east-1 &> /dev/null; then
        echo "   - Updating existing function..."
        aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file fileb://function.zip \
            --region us-east-1 \
            --output json > /dev/null
    else
        echo "   - Creating new function..."
        aws lambda create-function \
            --function-name "$FUNCTION_NAME" \
            --runtime nodejs18.x \
            --role "arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-edge-role" \
            --handler index.handler \
            --zip-file fileb://function.zip \
            --description "$DESCRIPTION" \
            --region us-east-1 \
            --publish \
            --output json > /dev/null
    fi
    
    # Publish new version
    echo "   - Publishing new version..."
    VERSION=$(aws lambda publish-version \
        --function-name "$FUNCTION_NAME" \
        --region us-east-1 \
        --query 'Version' \
        --output text)
    
    echo "   ✅ Deployed version: $VERSION"
    
    # Clean up
    rm function.zip
    
    cd - > /dev/null
    
    echo ""
}

# Deploy Viewer Request Lambda
deploy_lambda \
    "premium-content-viewer-request" \
    "./viewer-request" \
    "Viewer Request Lambda for JWT validation and tier checking"

# Deploy Origin Request Lambda
deploy_lambda \
    "premium-content-origin-request" \
    "./origin-request" \
    "Origin Request Lambda for custom headers and logging"

echo "✅ All Lambda@Edge functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Note the function ARNs and versions"
echo "   2. Attach these functions to your CloudFront distribution"
echo "   3. Wait 15-30 minutes for global propagation"
echo ""

# PowerShell Script để Deploy Lambda@Edge Functions
# Chạy script này từ thư mục gốc của project

param(
    [Parameter(Mandatory=$true)]
    [string]$AccountId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Starting Lambda@Edge Deployment..." -ForegroundColor Cyan
Write-Host ""

# Kiểm tra AWS CLI
try {
    aws --version | Out-Null
} catch {
    Write-Host "❌ AWS CLI không được cài đặt!" -ForegroundColor Red
    Write-Host "Tải tại: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra credentials
try {
    $identity = aws sts get-caller-identity --query 'Account' --output text
    if ($identity -ne $AccountId) {
        Write-Host "⚠️  Warning: Account ID không khớp!" -ForegroundColor Yellow
        Write-Host "   Configured: $identity" -ForegroundColor Yellow
        Write-Host "   Provided: $AccountId" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ AWS credentials chưa được cấu hình!" -ForegroundColor Red
    Write-Host "Chạy: aws configure" -ForegroundColor Yellow
    exit 1
}

# Tạo IAM Role nếu chưa tồn tại
Write-Host "📋 Checking IAM Role..." -ForegroundColor Cyan
$roleName = "lambda-edge-execution-role"

try {
    $roleArn = aws iam get-role --role-name $roleName --query 'Role.Arn' --output text 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   Creating IAM role..." -ForegroundColor Yellow
        
        # Tạo trust policy
        $trustPolicy = @"
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
"@
        
        $trustPolicy | Out-File -FilePath "lambda-edge-trust-policy.json" -Encoding utf8
        
        aws iam create-role `
            --role-name $roleName `
            --assume-role-policy-document file://lambda-edge-trust-policy.json | Out-Null
        
        aws iam attach-role-policy `
            --role-name $roleName `
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" | Out-Null
        
        Remove-Item "lambda-edge-trust-policy.json"
        
        Write-Host "   ✅ IAM role created" -ForegroundColor Green
        
        # Đợi role propagate
        Write-Host "   Waiting for role to propagate (10s)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        $roleArn = "arn:aws:iam::${AccountId}:role/$roleName"
    } else {
        Write-Host "   ✅ IAM role exists" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error creating IAM role: $_" -ForegroundColor Red
    exit 1
}

Write-Host "   Role ARN: $roleArn" -ForegroundColor Gray
Write-Host ""

# Deploy Viewer Request Lambda
Write-Host "📦 Deploying Viewer Request Lambda..." -ForegroundColor Cyan
Set-Location "lambda-edge\viewer-request"

# Xóa zip cũ nếu có
if (Test-Path "function.zip") {
    Remove-Item "function.zip"
}

# Tạo zip file
Write-Host "   Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path "index.js","package.json","../shared/*" -DestinationPath "function.zip" -Force

# Deploy function
$viewerFunctionName = "premium-content-viewer-request"

try {
    # Kiểm tra function đã tồn tại chưa
    $existingFunction = aws lambda get-function --function-name $viewerFunctionName --region $Region 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Updating existing function..." -ForegroundColor Yellow
        
        aws lambda update-function-code `
            --function-name $viewerFunctionName `
            --zip-file fileb://function.zip `
            --region $Region `
            --publish | Out-Null
    } else {
        Write-Host "   Creating new function..." -ForegroundColor Yellow
        
        aws lambda create-function `
            --function-name $viewerFunctionName `
            --runtime nodejs18.x `
            --role $roleArn `
            --handler index.handler `
            --zip-file fileb://function.zip `
            --region $Region `
            --publish | Out-Null
    }
    
    # Lấy version ARN
    $viewerArn = aws lambda list-versions-by-function `
        --function-name $viewerFunctionName `
        --region $Region `
        --query 'Versions[-1].FunctionArn' `
        --output text
    
    Write-Host "   ✅ Viewer Request Lambda deployed" -ForegroundColor Green
    Write-Host "   ARN: $viewerArn" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error deploying Viewer Request Lambda: $_" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}

Set-Location "../.."
Write-Host ""

# Deploy Origin Request Lambda
Write-Host "📦 Deploying Origin Request Lambda..." -ForegroundColor Cyan
Set-Location "lambda-edge\origin-request"

# Xóa zip cũ nếu có
if (Test-Path "function.zip") {
    Remove-Item "function.zip"
}

# Tạo zip file
Write-Host "   Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path "index.js","package.json","../shared/*" -DestinationPath "function.zip" -Force

# Deploy function
$originFunctionName = "premium-content-origin-request"

try {
    # Kiểm tra function đã tồn tại chưa
    $existingFunction = aws lambda get-function --function-name $originFunctionName --region $Region 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Updating existing function..." -ForegroundColor Yellow
        
        aws lambda update-function-code `
            --function-name $originFunctionName `
            --zip-file fileb://function.zip `
            --region $Region `
            --publish | Out-Null
    } else {
        Write-Host "   Creating new function..." -ForegroundColor Yellow
        
        aws lambda create-function `
            --function-name $originFunctionName `
            --runtime nodejs18.x `
            --role $roleArn `
            --handler index.handler `
            --zip-file fileb://function.zip `
            --region $Region `
            --publish | Out-Null
    }
    
    # Lấy version ARN
    $originArn = aws lambda list-versions-by-function `
        --function-name $originFunctionName `
        --region $Region `
        --query 'Versions[-1].FunctionArn' `
        --output text
    
    Write-Host "   ✅ Origin Request Lambda deployed" -ForegroundColor Green
    Write-Host "   ARN: $originArn" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error deploying Origin Request Lambda: $_" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}

Set-Location "../.."
Write-Host ""

# Tạo file kết quả
Write-Host "📝 Saving deployment info..." -ForegroundColor Cyan

$deploymentInfo = @"
# Lambda@Edge Deployment Info
Deployed at: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Function ARNs

### Viewer Request Lambda
``````
$viewerArn
``````

### Origin Request Lambda
``````
$originArn
``````

## Next Steps

1. Vào CloudFront Console
2. Chọn distribution của bạn
3. Tab **Behaviors** → Edit **Default (*)** behavior
4. Scroll xuống **Function associations**
5. Thêm:
   - **Viewer request**: $viewerArn
   - **Origin request**: $originArn
6. Click **Save changes**
7. Đợi 15-30 phút để deploy

## Test Commands

### Free Content (Should work)
``````bash
curl https://YOUR-CLOUDFRONT-DOMAIN/free/intro-web-dev.mp4
``````

### Premium Content Without JWT (Should fail with 401)
``````bash
curl https://YOUR-CLOUDFRONT-DOMAIN/premium/advanced-lambda-edge.mp4
``````

### Premium Content With JWT (Should work)
``````bash
# Get token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"premium@demo.com","password":"password123"}'

# Use token
curl https://YOUR-CLOUDFRONT-DOMAIN/premium/advanced-lambda-edge.mp4 \
  -H "Authorization: Bearer YOUR-TOKEN"
``````
"@

$deploymentInfo | Out-File -FilePath "lambda-edge-deployment-info.md" -Encoding utf8

Write-Host "   ✅ Deployment info saved to: lambda-edge-deployment-info.md" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Lambda@Edge Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Attach Lambda functions to CloudFront distribution" -ForegroundColor White
Write-Host "   2. Wait 15-30 minutes for deployment" -ForegroundColor White
Write-Host "   3. Test with the commands in lambda-edge-deployment-info.md" -ForegroundColor White
Write-Host ""
Write-Host "📖 See: lambda-edge-deployment-info.md for details" -ForegroundColor Yellow

# Lambda@Edge Deployment Guide

## Bước 5: Deploy Lambda@Edge Functions

### Chuẩn Bị

Lambda@Edge functions **PHẢI** được deploy ở region **us-east-1**.

---

## Phần A: Tạo IAM Role cho Lambda@Edge

### 1. Tạo Trust Policy File

Tạo file `lambda-edge-trust-policy.json`:

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

### 2. Tạo IAM Role

```bash
# Tạo role
aws iam create-role \
  --role-name lambda-edge-execution-role \
  --assume-role-policy-document file://lambda-edge-trust-policy.json

# Attach policy cho CloudWatch Logs
aws iam attach-role-policy \
  --role-name lambda-edge-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### 3. Lấy Role ARN

```bash
aws iam get-role --role-name lambda-edge-execution-role --query 'Role.Arn' --output text
```

**Lưu lại ARN**: `arn:aws:iam::<ACCOUNT-ID>:role/lambda-edge-execution-role`

---

## Phần B: Deploy Viewer Request Lambda

### 1. Package Function

```bash
cd lambda-edge/viewer-request

# Tạo deployment package
powershell Compress-Archive -Path index.js,package.json,../shared/* -DestinationPath function.zip -Force
```

### 2. Create Lambda Function

```bash
# Thay <ACCOUNT-ID> bằng AWS Account ID của bạn
aws lambda create-function \
  --function-name premium-content-viewer-request \
  --runtime nodejs18.x \
  --role arn:aws:iam::<ACCOUNT-ID>:role/lambda-edge-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --region us-east-1 \
  --publish
```

### 3. Lưu Version ARN

Output sẽ có `FunctionArn` dạng:
```
arn:aws:lambda:us-east-1:<ACCOUNT-ID>:function:premium-content-viewer-request:1
```

**Lưu lại ARN này** - bạn sẽ cần nó để attach vào CloudFront!

---

## Phần C: Deploy Origin Request Lambda

### 1. Package Function

```bash
cd ../origin-request

# Tạo deployment package
powershell Compress-Archive -Path index.js,package.json,../shared/* -DestinationPath function.zip -Force
```

### 2. Create Lambda Function

```bash
aws lambda create-function \
  --function-name premium-content-origin-request \
  --runtime nodejs18.x \
  --role arn:aws:iam::<ACCOUNT-ID>:role/lambda-edge-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --region us-east-1 \
  --publish
```

### 3. Lưu Version ARN

Lưu lại ARN của function này.

---

## Phần D: Kiểm Tra Lambda Functions

```bash
# List functions
aws lambda list-functions --region us-east-1 --query 'Functions[?starts_with(FunctionName, `premium-content`)].FunctionName'

# Get function info
aws lambda get-function --function-name premium-content-viewer-request --region us-east-1
```

---

## Phần E: Test Lambda Functions Locally (Optional)

Tạo test event `test-event.json`:

```json
{
  "Records": [
    {
      "cf": {
        "request": {
          "uri": "/premium/test.mp4",
          "headers": {
            "authorization": [
              {
                "key": "Authorization",
                "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              }
            ]
          }
        }
      }
    }
  ]
}
```

Test:
```bash
aws lambda invoke \
  --function-name premium-content-viewer-request \
  --payload file://test-event.json \
  --region us-east-1 \
  response.json

cat response.json
```

---

## Bước 6: Attach Lambda@Edge vào CloudFront

### Phần A: Lấy Distribution Config

```bash
# Lấy Distribution ID
aws cloudfront list-distributions --query 'DistributionList.Items[0].Id' --output text

# Lưu vào biến (PowerShell)
$DIST_ID = aws cloudfront list-distributions --query 'DistributionList.Items[0].Id' --output text

# Lấy config hiện tại
aws cloudfront get-distribution-config --id $DIST_ID > dist-config.json
```

### Phần B: Cập Nhật Config

Mở file `dist-config.json` và tìm phần `DefaultCacheBehavior`.

Thêm `LambdaFunctionAssociations`:

```json
{
  "DefaultCacheBehavior": {
    ...
    "LambdaFunctionAssociations": {
      "Quantity": 2,
      "Items": [
        {
          "LambdaFunctionARN": "arn:aws:lambda:us-east-1:<ACCOUNT-ID>:function:premium-content-viewer-request:1",
          "EventType": "viewer-request",
          "IncludeBody": false
        },
        {
          "LambdaFunctionARN": "arn:aws:lambda:us-east-1:<ACCOUNT-ID>:function:premium-content-origin-request:1",
          "EventType": "origin-request",
          "IncludeBody": false
        }
      ]
    },
    ...
  }
}
```

**Lưu ý**: 
- Phải dùng **versioned ARN** (có `:1` ở cuối)
- Không được dùng `$LATEST`

### Phần C: Extract ETag

```bash
# Lấy ETag từ response
$ETAG = (aws cloudfront get-distribution-config --id $DIST_ID --query 'ETag' --output text)
```

### Phần D: Update Distribution

```bash
# Tạo file config mới (chỉ lấy phần DistributionConfig)
# Bạn cần extract phần DistributionConfig từ dist-config.json

aws cloudfront update-distribution \
  --id $DIST_ID \
  --distribution-config file://distribution-config.json \
  --if-match $ETAG
```

---

## Phần E: Đợi Deployment

⏳ **Thời gian**: 15-30 phút

Lambda@Edge cần thời gian để replicate đến tất cả edge locations.

Check status:
```bash
aws cloudfront get-distribution --id $DIST_ID --query 'Distribution.Status'
```

Đợi đến khi status = `Deployed`

---

## Phần F: Test Lambda@Edge

### Test 1: Free Content (Không cần JWT)

```bash
curl https://d1234abcd.cloudfront.net/free/intro-web-dev.mp4
```

**Kết quả mong đợi**: Trả về nội dung file ✅

### Test 2: Premium Content Không Có JWT

```bash
curl https://d1234abcd.cloudfront.net/premium/advanced-lambda-edge.mp4
```

**Kết quả mong đợi**: 401 Unauthorized ✅

### Test 3: Premium Content Với JWT

Trước tiên, lấy JWT token từ backend:

```bash
# Login và lấy token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"premium@demo.com","password":"password123"}'
```

Copy token và test:

```bash
curl https://d1234abcd.cloudfront.net/premium/advanced-lambda-edge.mp4 \
  -H "Authorization: Bearer <your-token>"
```

**Kết quả mong đợi**: Trả về nội dung file ✅

---

## Troubleshooting

### Lambda Function Quá Lớn (> 1MB)

**Nguyên nhân**: Package có dependencies

**Giải pháp**: 
- Xóa `node_modules` nếu có
- Chỉ package `index.js`, `package.json`, và `shared/`

### CloudFront Không Trigger Lambda

**Nguyên nhân**: 
- Chưa đợi đủ thời gian deploy
- Dùng `$LATEST` thay vì versioned ARN

**Giải pháp**:
- Đợi 15-30 phút
- Kiểm tra ARN có `:1` ở cuối

### 403 Forbidden Thay Vì 401

**Nguyên nhân**: Lambda đang trả về response sai format

**Giải pháp**: Check CloudWatch Logs ở region gần nhất với bạn

---

## Checklist

- [ ] Tạo IAM role cho Lambda@Edge
- [ ] Deploy viewer-request Lambda
- [ ] Deploy origin-request Lambda
- [ ] Lưu cả 2 versioned ARNs
- [ ] Update CloudFront distribution config
- [ ] Đợi distribution deploy xong
- [ ] Test free content (hoạt động)
- [ ] Test premium content không JWT (bị chặn)
- [ ] Test premium content có JWT (hoạt động)

Khi hoàn thành, hệ thống của bạn đã sẵn sàng! 🎉

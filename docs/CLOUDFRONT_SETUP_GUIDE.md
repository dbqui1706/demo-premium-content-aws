# CloudFront Distribution Setup Guide

## Bước 4: Tạo CloudFront Distribution

### Phần A: Tạo Origin Access Identity (OAI)

1. Mở **AWS Console** → Tìm **CloudFront**
2. Bên trái menu, click **Origin Access** → **Origin access identities**
3. Click **Create origin access identity**
4. **Name**: `premium-content-oai`
5. **Comment**: `OAI for premium content S3 bucket`
6. Click **Create**
7. **Lưu lại OAI ID** (dạng: `E1234ABCDEFGH`)

---

### Phần B: Cập nhật S3 Bucket Policy

1. Vào **S3 Console** → Chọn bucket của bạn
2. Tab **Permissions** → **Bucket policy**
3. Click **Edit** và paste policy này (thay `<BUCKET-NAME>` và `<OAI-ID>`):

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
      "Resource": "arn:aws:s3:::<BUCKET-NAME>/*"
    }
  ]
}
```

4. Click **Save changes**

---

### Phần C: Tạo CloudFront Distribution

1. Vào **CloudFront Console**
2. Click **Create distribution**

#### Origin Settings

- **Origin domain**: Chọn S3 bucket của bạn từ dropdown
- **Origin path**: Để trống
- **Name**: Giữ nguyên (tự động)
- **Origin access**: 
  - Chọn **Legacy access identities**
  - **Origin access identity**: Chọn OAI vừa tạo
  - **Bucket policy**: Chọn **Yes, update the bucket policy**

#### Default Cache Behavior

- **Path pattern**: `Default (*)`
- **Viewer protocol policy**: **Redirect HTTP to HTTPS**
- **Allowed HTTP methods**: **GET, HEAD, OPTIONS**
- **Cache policy**: **CachingOptimized**
- **Origin request policy**: **CORS-S3Origin**

#### Function Associations (BỎ QUA BƯỚC NÀY - sẽ thêm Lambda@Edge sau)

Để trống phần này, chúng ta sẽ attach Lambda@Edge functions sau khi distribution được tạo.

#### Settings

- **Price class**: **Use all edge locations** (hoặc chọn theo budget)
- **Alternate domain names (CNAMEs)**: Để trống
- **Custom SSL certificate**: **Default CloudFront Certificate**
- **Supported HTTP versions**: **HTTP/2**
- **Default root object**: Để trống
- **Standard logging**: **Off** (hoặc bật nếu muốn)
- **IPv6**: **On**

3. Click **Create distribution**

---

### Phần D: Đợi Distribution Deploy

⏳ **Thời gian**: 15-30 phút

1. Trạng thái sẽ là **Deploying** → đợi đến khi chuyển thành **Enabled**
2. **Lưu lại Distribution Domain Name**: `d1234abcd.cloudfront.net`

Trong lúc đợi, bạn có thể:
- ☕ Uống cà phê
- 📝 Chuẩn bị deploy Lambda@Edge functions
- ⚙️ Cập nhật backend `.env` file

---

### Phần E: Cập nhật Backend Configuration

Trong khi đợi CloudFront deploy, cập nhật file `backend/.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>

# CloudFront Configuration
CLOUDFRONT_DOMAIN=d1234abcd.cloudfront.net  # ← Thay bằng domain của bạn
CLOUDFRONT_KEY_PAIR_ID=<your-key-pair-id>   # ← Từ bước 3
CLOUDFRONT_PRIVATE_KEY_PATH=./keys/cloudfront-private-key.pem

# S3 Configuration
S3_BUCKET_NAME=premium-content-demo-<your-unique-id>

# Server Configuration
PORT=3000
NODE_ENV=development
```

---

### Phần F: Test CloudFront (Không có Lambda@Edge)

Sau khi distribution status = **Enabled**, test xem CloudFront có hoạt động không:

```bash
# Test free content
curl https://d1234abcd.cloudfront.net/free/intro-web-dev.mp4

# Test premium content (sẽ hoạt động vì chưa có Lambda@Edge)
curl https://d1234abcd.cloudfront.net/premium/advanced-lambda-edge.mp4
```

Nếu thấy nội dung file → CloudFront đã hoạt động! ✅

---

## Tiếp Theo: Deploy Lambda@Edge

Sau khi CloudFront distribution đã **Enabled**, chuyển sang:
- **Bước 5**: Deploy Lambda@Edge Functions
- **Bước 6**: Attach Lambda@Edge vào CloudFront

---

## Troubleshooting

### Lỗi: Access Denied

**Nguyên nhân**: Bucket policy chưa đúng hoặc OAI chưa được cấu hình

**Giải pháp**:
1. Kiểm tra lại bucket policy
2. Đảm bảo OAI ID đúng
3. Xóa và tạo lại distribution nếu cần

### Distribution mất quá lâu để deploy

**Bình thường**: 15-30 phút
**Nếu > 1 giờ**: Có thể có vấn đề, check CloudWatch Logs

---

## Checklist

- [ ] Tạo OAI thành công
- [ ] Cập nhật S3 bucket policy
- [ ] Tạo CloudFront distribution
- [ ] Distribution status = **Enabled**
- [ ] Lưu Distribution Domain Name
- [ ] Cập nhật backend `.env` file
- [ ] Test CloudFront với curl (cả free và premium đều hoạt động)

Khi hoàn thành checklist này, sẵn sàng cho **Bước 5: Deploy Lambda@Edge**! 🚀

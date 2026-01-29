# Troubleshooting Guide

Common issues and solutions for the Premium Content AWS Demo.

---

## Backend Issues

### Database Connection Error

**Error**: `Error: SQLITE_CANTOPEN: unable to open database file`

**Solution**:
```bash
# Ensure database directory exists
mkdir -p backend/database

# Re-run seed script
cd backend
npm run seed
```

---

### JWT Secret Not Set

**Error**: `JWT_SECRET not configured`

**Solution**:
```bash
# Copy .env.example and set JWT_SECRET
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
```

---

### CloudFront Private Key Not Found

**Error**: `ENOENT: no such file or directory, open './keys/cloudfront-private-key.pem'`

**Solution**:
```bash
# Ensure keys directory exists
mkdir -p backend/keys

# Copy your CloudFront private key
cp ~/Downloads/pk-XXXXX.pem backend/keys/cloudfront-private-key.pem

# Set correct permissions
chmod 400 backend/keys/cloudfront-private-key.pem
```

---

## Lambda@Edge Issues

### Lambda Function Size Exceeds 1MB

**Error**: `RequestEntityTooLargeException: Request must be smaller than 1 MB`

**Solution**:
- Lambda@Edge has strict size limits
- Our implementation uses NO external dependencies
- Ensure you're only packaging `index.js`, `package.json`, and `../shared/`
- Check zip file size: `ls -lh function.zip`

---

### Lambda@Edge Not Triggering

**Symptoms**: Requests bypass Lambda validation

**Solutions**:

1. **Wait for propagation** (15-30 minutes after deployment)
2. **Verify Lambda is attached**:
   ```bash
   aws cloudfront get-distribution-config --id <DIST_ID> | grep LambdaFunctionARN
   ```
3. **Check Lambda version**: Must use versioned ARN (`:1`, `:2`, etc.), not `$LATEST`
4. **Verify region**: Lambda@Edge must be in `us-east-1`

---

### CloudWatch Logs Not Appearing

**Issue**: Can't find Lambda@Edge logs

**Solution**:
- Lambda@Edge logs appear in CloudWatch in the **region closest to where the request was made**
- Check CloudWatch Logs in multiple regions (e.g., `us-east-1`, `eu-west-1`, `ap-southeast-1`)
- Log group name: `/aws/lambda/us-east-1.premium-content-viewer-request`

---

## CloudFront Issues

### 403 Forbidden on S3 Content

**Error**: `AccessDenied` when accessing content

**Solutions**:

1. **Check Origin Access Identity (OAI)**:
   - CloudFront distribution must have OAI configured
   - S3 bucket policy must allow OAI to read objects

2. **Update S3 bucket policy**:
   ```json
   {
     "Effect": "Allow",
     "Principal": {
       "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity <OAI-ID>"
     },
     "Action": "s3:GetObject",
     "Resource": "arn:aws:s3:::your-bucket/*"
   }
   ```

---

### Signed URL Expired

**Error**: `Request has expired`

**Solution**:
- Signed URLs expire after 15 minutes (configurable in `.env`)
- Request a new signed URL from the backend
- Check system time is synchronized

---

### CloudFront Caching Old Content

**Issue**: Changes not reflected immediately

**Solutions**:

1. **Create invalidation**:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id <DIST_ID> \
     --paths "/*"
   ```

2. **Wait for invalidation to complete** (5-10 minutes)

3. **Use cache-busting query parameters** during development

---

## Frontend Issues

### CORS Error

**Error**: `Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution**:
```javascript
// backend/src/server.js
app.use(cors({
  origin: 'http://localhost:5173',  // Add frontend URL
  credentials: true
}));
```

---

### JWT Token Not Persisting

**Issue**: User logged out on page refresh

**Solution**:
- Check browser localStorage: `localStorage.getItem('token')`
- Ensure token is being saved in Login.jsx
- Check for JavaScript errors in console

---

### Content Not Loading

**Symptoms**: Gallery shows "Loading..." indefinitely

**Solutions**:

1. **Check backend is running**: `curl http://localhost:3000/health`
2. **Check API proxy in vite.config.js**:
   ```javascript
   server: {
     proxy: {
       '/api': 'http://localhost:3000'
     }
   }
   ```
3. **Check browser console** for errors
4. **Verify database is seeded**: `npm run seed`

---

## AWS CLI Issues

### AWS Credentials Not Configured

**Error**: `Unable to locate credentials`

**Solution**:
```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json
```

---

### Insufficient Permissions

**Error**: `AccessDenied` or `UnauthorizedOperation`

**Solution**:
- Ensure IAM user has required permissions:
  - `AmazonS3FullAccess`
  - `CloudFrontFullAccess`
  - `AWSLambda_FullAccess`
  - `IAMFullAccess` (for creating roles)

---

## General Debugging Tips

### Enable Verbose Logging

**Backend**:
```javascript
// Add to server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

**Lambda@Edge**:
```javascript
// Add console.log statements
console.log('Request:', JSON.stringify(request, null, 2));
console.log('Headers:', JSON.stringify(request.headers, null, 2));
```

### Check CloudFront Distribution Status

```bash
aws cloudfront get-distribution --id <DIST_ID> --query 'Distribution.Status'
```

Status should be `Deployed` before testing.

### Verify Lambda Function Exists

```bash
aws lambda get-function --function-name premium-content-viewer-request --region us-east-1
```

---

## Still Having Issues?

1. Check all environment variables in `.env`
2. Verify AWS resources are in correct regions
3. Check CloudWatch Logs for detailed errors
4. Review [Architecture Documentation](ARCHITECTURE.md)
5. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Relevant logs

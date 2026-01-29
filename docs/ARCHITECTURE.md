# System Architecture

Detailed architecture documentation for the Premium Content AWS Demo.

---

## Overview

This system demonstrates how to use **AWS Lambda@Edge** with **CloudFront Signed URLs** to protect premium content. The architecture enforces tier-based access control at the edge, ensuring that only authorized users can access premium content.

---

## Architecture Diagram

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│   React Frontend        │
│   (Vite + TailwindCSS)  │
└────────┬────────────────┘
         │
         │ 1. Login/Register
         │ 2. Request Content Access
         ▼
┌─────────────────────────┐
│   Backend API           │
│   (Express + JWT)       │
│   - User Auth           │
│   - Content Metadata    │
│   - Signed URL Gen      │
└────────┬────────────────┘
         │
         │ 3. Generate Signed URL
         ▼
┌─────────────────────────┐
│   CloudFront            │
│   Distribution          │
└────────┬────────────────┘
         │
         │ 4. Viewer Request Event
         ▼
┌─────────────────────────┐
│   Lambda@Edge           │
│   (Viewer Request)      │
│   - Extract JWT         │
│   - Validate Token      │
│   - Check User Tier     │
│   - Add Custom Headers  │
└────────┬────────────────┘
         │
         │ 5. Origin Request Event
         ▼
┌─────────────────────────┐
│   Lambda@Edge           │
│   (Origin Request)      │
│   - Read User Headers   │
│   - Add Metadata        │
│   - Logging             │
└────────┬────────────────┘
         │
         │ 6. Fetch Content
         ▼
┌─────────────────────────┐
│   S3 Bucket             │
│   - free/               │
│   - premium/            │
└─────────────────────────┘
```

---

## Component Details

### 1. React Frontend

**Technology**: React 18 + Vite + TailwindCSS

**Responsibilities**:
- User authentication UI (login/register)
- Content gallery with tier badges
- Content viewer for videos, PDFs, images
- JWT token management (localStorage)
- API communication via Axios

**Key Files**:
- `src/pages/Login.jsx` - Authentication
- `src/pages/Gallery.jsx` - Content listing
- `src/pages/ContentViewer.jsx` - Content display
- `src/services/api.js` - API client with JWT interceptor

---

### 2. Backend API

**Technology**: Node.js + Express + SQLite

**Responsibilities**:
- User registration and authentication
- JWT token generation and validation
- Content metadata management
- CloudFront signed URL generation
- Access logging

**Key Components**:
- **Auth Service**: Password hashing (bcrypt), JWT generation
- **Content Service**: Content filtering by tier
- **Signed URL Service**: CloudFront URL signing with private key
- **Database**: SQLite with users, content, and access_logs tables

**Security Features**:
- Helmet.js for security headers
- Rate limiting (100 req/15min)
- CORS protection
- Password hashing with bcrypt

---

### 3. CloudFront Distribution

**Purpose**: Global CDN for content delivery

**Configuration**:
- **Origin**: S3 bucket with OAI (Origin Access Identity)
- **Behaviors**: Default behavior with Lambda@Edge associations
- **Signed URLs**: Required for premium content access
- **Caching**: CachingOptimized policy

**Lambda@Edge Associations**:
- Viewer Request: JWT validation
- Origin Request: Custom headers

---

### 4. Lambda@Edge Functions

#### Viewer Request Lambda

**Trigger**: Before CloudFront checks cache

**Purpose**: Validate JWT and enforce access control

**Logic**:
1. Extract JWT from `Authorization` header or query parameter
2. Decode and validate JWT (expiration, structure)
3. Check user tier from JWT payload
4. For premium content:
   - If tier is "free" → Return 403 Forbidden
   - If tier is "premium" → Add custom headers and allow
5. For free content → Allow without authentication

**Custom Headers Added**:
- `X-User-Id`: User ID from JWT
- `X-User-Tier`: User tier (free/premium)
- `X-User-Email`: User email

**Size Constraints**:
- Must be < 1MB (no external dependencies)
- Uses custom JWT validator (no jsonwebtoken library)

#### Origin Request Lambda

**Trigger**: After cache miss, before S3 request

**Purpose**: Add metadata and logging headers

**Logic**:
1. Read custom headers from viewer request
2. Add timestamp and request ID
3. Add content tier metadata
4. Log access for analytics

**Headers Added**:
- `X-Request-Timestamp`: ISO timestamp
- `X-Request-Id`: Unique request identifier
- `X-Content-Tier`: Content tier (free/premium)
- `X-Access-Metadata`: JSON metadata for logging

---

### 5. S3 Bucket

**Structure**:
```
s3://premium-content-demo-bucket/
├── free/
│   ├── intro-web-dev.mp4
│   ├── getting-started.pdf
│   └── architecture-diagram.png
└── premium/
    ├── advanced-lambda-edge.mp4
    ├── aws-security-guide.pdf
    └── cloudfront-blueprint.png
```

**Access Control**:
- Bucket policy allows only CloudFront OAI
- Direct S3 access is blocked
- Content accessible only via CloudFront

---

## Request Flow

### Scenario 1: Free User Accessing Free Content

```
1. User logs in → Backend issues JWT with tier="free"
2. User clicks free content → Frontend requests signed URL
3. Backend generates CloudFront signed URL
4. User accesses URL → CloudFront triggers Viewer Request Lambda
5. Lambda checks: URI starts with /free/ → Allow without JWT check
6. CloudFront fetches from S3 → Content delivered
```

### Scenario 2: Free User Accessing Premium Content

```
1. User logs in → Backend issues JWT with tier="free"
2. User clicks premium content → Frontend requests signed URL
3. Backend generates CloudFront signed URL
4. User accesses URL → CloudFront triggers Viewer Request Lambda
5. Lambda checks:
   - URI starts with /premium/ → Requires authentication
   - JWT tier = "free" → BLOCK with 403 Forbidden
6. User sees "Premium Required" error
```

### Scenario 3: Premium User Accessing Premium Content

```
1. User logs in → Backend issues JWT with tier="premium"
2. User clicks premium content → Frontend requests signed URL
3. Backend generates CloudFront signed URL (expires in 15 min)
4. User accesses URL → CloudFront triggers Viewer Request Lambda
5. Lambda checks:
   - URI starts with /premium/ → Requires authentication
   - JWT valid and tier = "premium" → Allow
   - Adds headers: X-User-Tier, X-User-Id
6. Origin Request Lambda adds metadata headers
7. CloudFront fetches from S3 → Content delivered
8. Content cached at edge for subsequent requests
```

---

## Security Considerations

### 1. JWT Validation at Edge

- **Benefit**: Validation happens at CloudFront edge locations (low latency)
- **Trade-off**: No signature verification (size constraints)
- **Mitigation**: Short token expiration (24h), HTTPS only

### 2. Signed URLs

- **Expiration**: 15 minutes (configurable)
- **Scope**: Specific to one S3 object
- **Rotation**: New URL generated for each access request

### 3. S3 Bucket Security

- **No public access**: Bucket policy allows only CloudFront OAI
- **Encryption**: Can enable S3 encryption at rest
- **Versioning**: Can enable for content recovery

### 4. Rate Limiting

- **API**: 100 requests per 15 minutes per IP
- **CloudFront**: Can add AWS WAF for DDoS protection

---

## Scalability

### Global Distribution

- CloudFront has 400+ edge locations worldwide
- Lambda@Edge runs at edge locations (low latency)
- Content cached at edge (reduced origin load)

### Auto-Scaling

- Lambda@Edge scales automatically
- S3 scales automatically
- Backend API can be deployed to Lambda or ECS for auto-scaling

### Performance Optimization

- **CloudFront caching**: Reduces origin requests
- **Edge validation**: No backend call for JWT check
- **Signed URL caching**: Backend generates URL once, reused for 15 min

---

## Cost Optimization

### Free Tier Eligible

- Lambda@Edge: 1M requests/month free
- CloudFront: 1TB data transfer out/month free (first 12 months)
- S3: 5GB storage, 20K GET requests/month free

### Cost Factors

- **CloudFront**: Data transfer out ($0.085/GB)
- **Lambda@Edge**: Requests ($0.60/1M) + Duration ($0.00005001/GB-second)
- **S3**: Storage ($0.023/GB) + Requests ($0.0004/1K GET)

### Optimization Tips

- Enable CloudFront compression
- Use appropriate cache TTLs
- Implement S3 lifecycle policies for old content

---

## Monitoring

### CloudWatch Metrics

- **Lambda@Edge**: Invocations, errors, duration
- **CloudFront**: Requests, bytes downloaded, error rate
- **S3**: Bucket size, request count

### Logging

- **Lambda@Edge Logs**: CloudWatch Logs (regional)
- **CloudFront Access Logs**: S3 bucket
- **Backend Logs**: Console or CloudWatch Logs

### Alerts

- Lambda errors > threshold
- CloudFront 4xx/5xx rate > threshold
- S3 bucket size > threshold

---

## Future Enhancements

1. **Signature Verification**: Use Lambda Layer with crypto library
2. **User Analytics**: Track content views, popular content
3. **Content Recommendations**: Based on user tier and history
4. **Multi-Region Backend**: Deploy API to multiple regions
5. **CDK Deployment**: Automate infrastructure with AWS CDK
6. **CI/CD Pipeline**: Automated testing and deployment

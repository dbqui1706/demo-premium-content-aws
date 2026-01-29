# API Documentation

Complete API reference for the Premium Content Demo backend.

**Base URL**: `http://localhost:3000/api`

---

## Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### POST /auth/register

Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "tier": "free"  // or "premium"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "tier": "free"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /auth/login

Login with existing credentials.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "tier": "free"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET /auth/me

Get current user information (requires authentication).

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "tier": "free"
    }
  }
}
```

---

### GET /content

Get list of all content (filtered by user tier if authenticated).

**Query Parameters**:
- `tier` (optional): Filter by tier (`free` or `premium`)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Introduction to Web Development",
      "description": "Learn the basics of HTML, CSS, and JavaScript",
      "type": "video",
      "tier": "free",
      "s3_key": "free/intro-web-dev.mp4",
      "thumbnail": "free/intro-web-dev-thumb.jpg",
      "duration": 1200,
      "file_size": 52428800,
      "created_at": "2024-01-27T12:00:00.000Z"
    }
  ]
}
```

---

### GET /content/:id

Get content metadata by ID.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Introduction to Web Development",
    "description": "Learn the basics of HTML, CSS, and JavaScript",
    "type": "video",
    "tier": "free",
    "s3_key": "free/intro-web-dev.mp4",
    "thumbnail": "free/intro-web-dev-thumb.jpg",
    "duration": 1200,
    "file_size": 52428800
  }
}
```

---

### POST /content/:id/access

Get signed URL for content access (requires authentication).

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "signedUrl": "https://d1234abcd.cloudfront.net/premium/video.mp4?Expires=...",
    "content": {
      "id": 4,
      "title": "Advanced Lambda@Edge Patterns",
      "type": "video",
      "tier": "premium"
    },
    "expiresIn": 900
  }
}
```

**Error Response** (403 Forbidden):
```json
{
  "success": false,
  "error": "This content requires premium tier. Your tier: free"
}
```

---

### GET /content/stats

Get content statistics.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 7,
    "free": 3,
    "premium": 4,
    "byType": {
      "video": 4,
      "pdf": 2,
      "image": 2
    }
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Status Codes**:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

API is rate-limited to **100 requests per 15 minutes** per IP address.

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

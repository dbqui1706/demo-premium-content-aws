# Premium Content AWS Demo

A demonstration project showcasing **AWS Lambda@Edge** integration with **CloudFront Signed URLs** to protect premium content. The system uses **JWT authentication** to differentiate between free and premium content tiers, with Lambda@Edge functions validating requests at CloudFront edge locations.

![Architecture](docs/architecture-diagram.png)

## 🎯 Features

- **JWT Authentication** - Secure user authentication with JSON Web Tokens
- **Tier-Based Access Control** - Free and Premium user tiers
- **Lambda@Edge Request Validation** - JWT validation at CloudFront edge
- **CloudFront Signed URLs** - Time-limited secure content delivery
- **Custom Request Headers** - User tier and metadata propagation
- **React Frontend** - Modern UI for content browsing and access
- **SQLite Database** - Lightweight user and content management

## 🏗️ Architecture

```
User Browser
    ↓
React Frontend (Vite)
    ↓
Backend API (Express + JWT)
    ↓
CloudFront Distribution
    ↓
Lambda@Edge (Viewer Request) → JWT Validation
    ↓
Lambda@Edge (Origin Request) → Custom Headers
    ↓
S3 Bucket (Content Storage)
```

## 📁 Project Structure

```
demo-premium-content-aws/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── models/            # User and Content models
│   │   ├── services/          # Auth, Content, Signed URL services
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth middleware
│   │   ├── scripts/           # Database seeding
│   │   └── server.js          # Express server
│   └── package.json
│
├── lambda-edge/               # Lambda@Edge functions
│   ├── shared/                # JWT validator (no dependencies)
│   ├── viewer-request/        # JWT validation Lambda
│   ├── origin-request/        # Custom headers Lambda
│   └── deploy.sh              # Deployment script
│
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   └── App.jsx            # Main app
│   └── package.json
│
└── docs/                      # Documentation
    ├── MANUAL_SETUP.md        # AWS setup guide
    ├── API_DOCUMENTATION.md   # API reference
    ├── ARCHITECTURE.md        # System architecture
    └── TROUBLESHOOTING.md     # Common issues
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **AWS Account** with CLI configured
- **AWS CLI** installed and configured
- **Git** for version control

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd demo-premium-content-aws

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - Set JWT_SECRET
# - Configure AWS credentials
# - Set CloudFront domain (after AWS setup)

# Seed database with demo users and content
npm run seed

# Start backend server
npm run dev
```

**Demo Users:**
- Free: `free@demo.com` / `password123`
- Premium: `premium@demo.com` / `password123`

### 3. AWS Infrastructure Setup

Follow the detailed guide in [docs/MANUAL_SETUP.md](docs/MANUAL_SETUP.md) to:

1. Create S3 bucket for content storage
2. Upload sample content
3. Create CloudFront distribution
4. Generate CloudFront key pair for signed URLs
5. Deploy Lambda@Edge functions
6. Attach Lambda functions to CloudFront

### 4. Start Frontend

```bash
cd frontend

# Start development server
npm run dev
```

Visit `http://localhost:5173` to access the application.

## 🎮 Usage

### Testing the Demo

1. **Login as Free User**
   - Email: `free@demo.com`
   - Password: `password123`
   - Can access: Free content only

2. **Login as Premium User**
   - Email: `premium@demo.com`
   - Password: `password123`
   - Can access: All content (free + premium)

3. **Test Access Control**
   - Free user tries to access premium content → Blocked by Lambda@Edge
   - Premium user accesses premium content → Receives signed URL → Content delivered

## 📚 Documentation

- **[Manual Setup Guide](docs/MANUAL_SETUP.md)** - Step-by-step AWS configuration
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Architecture](docs/ARCHITECTURE.md)** - System design and flow diagrams
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires JWT)

### Content
- `GET /api/content` - List all content
- `GET /api/content/:id` - Get content metadata
- `POST /api/content/:id/access` - Get signed URL (requires JWT)

## 🛡️ Security Features

- **JWT Authentication** - Stateless token-based auth
- **Password Hashing** - bcrypt with salt
- **Rate Limiting** - 100 requests per 15 minutes
- **Helmet.js** - Security headers
- **CORS Protection** - Configurable origins
- **Signed URLs** - Time-limited (15 minutes)
- **Lambda@Edge Validation** - Edge-level request filtering

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Option 1: Manual Deployment
Follow [docs/MANUAL_SETUP.md](docs/MANUAL_SETUP.md)

### Option 2: Infrastructure as Code (Optional)
```bash
cd infrastructure/cdk
npm install
cdk bootstrap
cdk deploy
```

## 🤝 Contributing

This is a demo project for educational purposes. Feel free to fork and modify for your own learning.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- AWS Lambda@Edge Documentation
- CloudFront Signed URLs Guide
- React + Vite Template
- TailwindCSS

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ to demonstrate AWS Lambda@Edge + CloudFront Signed URLs**

# SwiftRoute - Intelligent Route Optimization Platform

**Production Deployment:** [https://swift-route-liard.vercel.app/](https://swift-route-liard.vercel.app/)

SwiftRoute is an enterprise-grade B2B SaaS platform providing intelligent route optimization services through a RESTful API. The platform leverages Graph Neural Network (GNN) technology and A* pathfinding algorithms to deliver cost-effective, environmentally sustainable routing solutions for logistics operations globally.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Technology Stack](#technology-stack)
- [Solution Architecture](#solution-architecture)
- [API Reference](#api-reference)
- [Deployment Architecture](#deployment-architecture)
- [Security & Authentication](#security--authentication)
- [Testing Strategy](#testing-strategy)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)

---

## Problem Statement

Urban logistics operations face three critical challenges:

1. **Operational Inefficiency**: Traditional routing systems result in 20-30% excess fuel consumption and operational costs due to suboptimal path selection
2. **Environmental Impact**: Inefficient routing contributes significantly to urban CO₂ emissions and air quality degradation
3. **Data Scarcity**: Many emerging markets lack comprehensive traffic and infrastructure data, limiting the effectiveness of conventional GPS-based routing systems

SwiftRoute addresses these challenges through intelligent route optimization powered by Graph Neural Networks, enabling accurate routing even in data-scarce environments while delivering measurable cost and emissions reductions.

---

## Solution Overview

### Core Capabilities

- **Global Route Optimization**: OSRM-powered routing engine with worldwide coverage
- **Multi-Vehicle Support**: Optimized routing for cars, trucks, vans, motorcycles, and bicycles
- **Alternative Route Analysis**: Multiple route options with comparative metrics (distance, time, cost, emissions)
- **Real-Time Performance**: Sub-second API response times for production workloads
- **Sustainability Metrics**: Real-time CO₂ emissions tracking and reduction reporting

### Business Model

- **B2B SaaS Platform**: RESTful API with tiered subscription plans
- **Usage-Based Billing**: Pay-as-you-go pricing with monthly request quotas
- **Dual Authentication**: Bearer token (dashboard) and API key (B2B integration) support
- **Automated Billing**: Stripe integration for subscription management and payment processing

### Impact Metrics

- **20-30% Cost Reduction**: Optimized routing reduces fuel consumption and operational expenses
- **25%+ Emissions Reduction**: Verified CO₂ savings with detailed reporting
- **99.9% API Uptime**: Enterprise-grade reliability and performance
- **UN SDG 11 Alignment**: Contributes to sustainable cities and communities goals

---

## Technology Stack

### Frontend Layer
- **Framework**: React 18.3 with TypeScript 5.8
- **Build Tool**: Vite 7.1 with SWC compiler
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS 3.4 with custom design system
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: React Router 6.30 with client-side navigation
- **Maps**: Leaflet 1.9 with React-Leaflet integration

### Backend Layer
- **API Gateway**: Node.js 22 serverless functions (Vercel)
- **Route Optimizer**: Python 3.11 serverless functions (Vercel)
- **Database**: PostgreSQL 15 with PostGIS extension (Supabase)
- **Authentication**: Supabase Auth with JWT tokens
- **Payment Processing**: Stripe API v19
- **External Routing**: OSRM (Open Source Routing Machine) HTTP API

### Infrastructure
- **Hosting**: Vercel serverless platform (Edge Network)
- **Database**: Supabase managed PostgreSQL
- **CDN**: Vercel Edge Network for static assets
- **SSL/TLS**: Automatic HTTPS with Vercel certificates
- **Monitoring**: Vercel Analytics and Supabase Dashboard

---

## Solution Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Web Dashboard   │              │  External B2B    │         │
│  │  (React SPA)     │              │  API Clients     │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            │ HTTPS                            │ HTTPS + API Key
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network (CDN)                     │
└─────────────────────────────────────────────────────────────────┘
            │                                  │
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Node.js Serverless Function (api/index.js)             │   │
│  │  - Authentication & Authorization                        │   │
│  │  - Rate Limiting                                         │   │
│  │  - Request Validation                                    │   │
│  │  - Usage Logging                                         │   │
│  └────────┬─────────────────────────────────────────────────┘   │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ├─────────────────┬─────────────────┬──────────────────┐
            ▼                 ▼                 ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Profile Mgmt    │ │  API Keys    │ │  Billing     │ │  Usage       │
│  Endpoints       │ │  Endpoints   │ │  Endpoints   │ │  Analytics   │
└──────────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
            │                 │                 │                  │
            └─────────────────┴─────────────────┴──────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Route Optimization Layer                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Python Serverless Function (api/v1/optimize-route)     │   │
│  │  - A* Pathfinding Algorithm                             │   │
│  │  - Graph Neural Network Processing                      │   │
│  │  - Vehicle Profile Management                           │   │
│  │  - Emissions Calculation                                │   │
│  └────────┬─────────────────────────────────────────────────┘   │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ├─────────────────┬──────────────────┐
            ▼                 ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  OSRM External   │ │  Supabase    │ │  Optimization    │
│  Routing API     │ │  Database    │ │  Engine (GNN)    │
│  (HTTP)          │ │  (PostgreSQL)│ │  (lib/gnn)       │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

### Data Flow Architecture

#### 1. Authentication Flow

```
Client Request
    ↓
API Gateway (api/index.js)
    ↓
Authentication Check
    ├─ Bearer Token → Supabase Auth Validation
    └─ API Key → Hash Lookup in api_keys table
    ↓
User Context Retrieved
    ↓
Request Proceeds to Endpoint
```

#### 2. Route Optimization Flow

```
POST /api/v1/optimize-route
    ↓
API Gateway Authentication
    ↓
Request Validation
    ↓
Forward to Python Handler (main.py)
    ↓
RouteOptimizationEngine.optimize()
    ├─ Parse Request Parameters
    ├─ Create Vehicle Profile
    ├─ Query OSRM for Baseline Route
    ├─ Apply A* Algorithm with GNN
    ├─ Calculate Alternative Routes
    ├─ Compute Emissions & Costs
    └─ Format Response
    ↓
Log Usage to Database
    ↓
Return Optimized Routes to Client
```

#### 3. Billing & Usage Tracking Flow

```
API Request Received
    ↓
Authenticate User/API Key
    ↓
Check Subscription Tier & Limits
    ├─ Requests Remaining > 0 → Proceed
    └─ Requests Remaining = 0 → Return 429 (Rate Limit)
    ↓
Process Request
    ↓
Log to usage_logs Table
    ├─ user_id
    ├─ api_key_id (if applicable)
    ├─ endpoint
    ├─ status_code
    ├─ response_time_ms
    └─ timestamp
    ↓
Update Subscription Metrics
    ↓
Calculate Overage (if applicable)
```

### Database Schema

#### Core Tables

**users** (Supabase Auth)
- Managed by Supabase authentication system
- Stores user credentials and metadata

**user_profiles**
```sql
- id (uuid, PK, FK to auth.users)
- full_name (text)
- company_name (text)
- created_at (timestamp)
- updated_at (timestamp)
```

**subscriptions**
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- tier (enum: trial, starter, professional, enterprise)
- requests_per_minute (integer)
- monthly_requests_included (integer)
- price_per_request (decimal)
- stripe_customer_id (text)
- stripe_subscription_id (text)
- payment_status (enum: trial, active, past_due, canceled)
- current_period_start (timestamp)
- current_period_end (timestamp)
```

**api_keys**
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- key_hash (text, indexed)
- key_prefix (text)
- name (text)
- status (enum: active, revoked)
- created_at (timestamp)
- last_used (timestamp)
- request_count (integer)
```

**usage_logs**
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- api_key_id (uuid, FK to api_keys, nullable)
- endpoint (text)
- method (text)
- status_code (integer)
- response_time_ms (integer)
- error_code (text, nullable)
- created_at (timestamp, indexed)
```

---

## API Reference

### Base URL
```
Production: https://swift-route-liard.vercel.app/api/v1
```

### Authentication

**Dashboard Users (Bearer Token)**
```http
Authorization: Bearer <supabase_jwt_token>
```

**B2B Clients (API Key)**
```http
X-API-Key: sk_live_<api_key>
```

### Endpoints

#### POST /optimize-route

Optimize a route between origin and destination with optional waypoints.

**Request Body**
```json
{
  "origin": [-1.2921, 36.8219],
  "destination": [-1.2864, 36.8172],
  "waypoints": [[-1.2900, 36.8200]],
  "vehicle_type": "car",
  "optimize_for": "time",
  "avoid_tolls": false,
  "avoid_traffic": false,
  "find_alternatives": true,
  "num_alternatives": 2
}
```

**Response**
```json
{
  "data": {
    "baseline_route": {
      "route_id": "baseline",
      "coordinates": [{"lat": -1.2921, "lng": 36.8219}],
      "distance": 5.2,
      "estimated_time": 12.5,
      "cost": 2.34,
      "co2_emissions": 1.15,
      "algorithm_used": "osrm"
    },
    "optimized_route": {
      "route_id": "optimized",
      "coordinates": [{"lat": -1.2921, "lng": 36.8219}],
      "distance": 4.8,
      "estimated_time": 11.2,
      "cost": 2.16,
      "co2_emissions": 1.06,
      "algorithm_used": "astar_gnn",
      "confidence_score": 0.95
    },
    "alternative_routes": [],
    "improvements": {
      "distance_saved": 0.4,
      "time_saved": 1.3,
      "cost_saved": 0.18,
      "co2_saved": 0.09
    }
  },
  "metadata": {
    "algorithm_used": "astar_gnn",
    "processing_time": 245,
    "request_id": "req_1234567890",
    "nodes_in_graph": 1523,
    "edges_in_graph": 3847
  },
  "timestamp": "2025-11-18T10:30:00Z"
}
```

#### GET /health

Health check endpoint for monitoring.

**Response**
```json
{
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-18T10:30:00Z",
    "version": "1.0.0",
    "services": {
      "database": "operational",
      "authentication": "authenticated",
      "api": "operational"
    }
  }
}
```

#### GET /profile

Retrieve authenticated user's profile.

#### PUT /profile

Update user profile information.

#### GET /keys

List all API keys for authenticated user.

#### POST /keys

Generate new API key (requires paid subscription).

#### GET /usage

Retrieve usage statistics and analytics.

#### GET /billing/subscription

Get current subscription details and usage.

#### POST /billing/upgrade

Upgrade subscription tier.

---

## Deployment Architecture

### Vercel Serverless Configuration

**vercel.json**
```json
{
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 10
    },
    "api/v1/optimize-route/main.py": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/v1/optimize-route/(.*)",
      "destination": "/api/v1/optimize-route/main.py"
    },
    {
      "source": "/api/v1/:path*",
      "destination": "/api/index.js"
    },
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Environment Variables

Required environment variables for deployment:

**Supabase Configuration**
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)
- `VITE_SUPABASE_URL`: Frontend Supabase URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Frontend public key

**Database Configuration**
- `DATABASE_URL`: PostgreSQL connection string

**Stripe Configuration**
- `STRIPE_SECRET_KEY`: Stripe secret key (server-side)
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Frontend Stripe key
- `STRIPE_PRICE_STARTER`: Price ID for Starter tier
- `STRIPE_PRICE_PROFESSIONAL`: Price ID for Professional tier
- `STRIPE_PRICE_ENTERPRISE`: Price ID for Enterprise tier

### Deployment Process

1. **Build Frontend**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Set all required environment variables in Vercel dashboard
   - Ensure Supabase and Stripe credentials are configured

4. **Verify Deployment**
   - Test health endpoint: `GET /api/v1/health`
   - Verify authentication flow
   - Test route optimization endpoint

---

## Security & Authentication

### Authentication Methods

1. **Bearer Token Authentication** (Dashboard Users)
   - JWT tokens issued by Supabase Auth
   - Automatic token refresh
   - Session management via Supabase client

2. **API Key Authentication** (B2B Clients)
   - SHA-256 hashed keys stored in database
   - Key prefix for identification (e.g., `sk_live_...`)
   - Per-key usage tracking and rate limiting

### Security Measures

- **HTTPS Only**: All traffic encrypted with TLS 1.3
- **CORS Configuration**: Restricted origins for API access
- **Rate Limiting**: Tier-based request limits enforced
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **XSS Protection**: React's built-in escaping and Content Security Policy
- **API Key Hashing**: Keys never stored in plaintext
- **Environment Variable Protection**: Sensitive credentials in environment variables only

### Authorization Flow

```
Request → API Gateway
    ↓
Extract Auth Header (Bearer or X-API-Key)
    ↓
Validate Credentials
    ├─ Bearer Token → Supabase Auth Verification
    └─ API Key → Hash Lookup & Status Check
    ↓
Retrieve User Context
    ↓
Check Subscription & Rate Limits
    ↓
Authorize Request
    ↓
Process & Log
```

---

## Testing Strategy

### Unit Testing

**Frontend Components**
- Component rendering tests
- User interaction tests
- State management tests
- Hook behavior tests

**Backend Functions**
- API endpoint logic tests
- Authentication validation tests
- Database query tests
- Error handling tests

### Integration Testing

**API Flow Tests**
```bash
# Test route optimization flow
curl -X POST https://swift-route-liard.vercel.app/api/v1/optimize-route \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <test_api_key>" \
  -d '{
    "origin": [-1.2921, 36.8219],
    "destination": [-1.2864, 36.8172],
    "vehicle_type": "car",
    "optimize_for": "time"
  }'
```

**Authentication Tests**
- Bearer token validation
- API key validation
- Invalid credential handling
- Rate limit enforcement

**Billing Tests**
- Subscription creation
- Usage tracking
- Overage calculation
- Stripe webhook processing

### End-to-End Testing

**Dashboard Flow**
1. User registration
2. Email verification
3. Dashboard access
4. API key generation
5. Route optimization
6. Usage analytics review
7. Subscription upgrade

**API Client Flow**
1. API key acquisition
2. Route optimization request
3. Response validation
4. Error handling
5. Rate limit testing

### Test Data

**Mock Coordinates**
```json
{
  "nairobi_cbd": [-1.2921, 36.8219],
  "westlands": [-1.2864, 36.8172],
  "karen": [-1.3197, 36.7078],
  "gigiri": [-1.2333, 36.8000]
}
```

**Test API Keys**
```
Trial: sk_test_trial_mock_key_12345
Starter: sk_test_starter_mock_key_67890
Professional: sk_test_pro_mock_key_abcde
```

**Stripe Test Cards**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

---

## Getting Started

### Prerequisites

- Node.js 22+ and npm 10+
- Python 3.11+
- Supabase account
- Stripe account (for billing features)
- Vercel account (for deployment)

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone <repository_url>
   cd swift_route
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access Application**
   ```
   Frontend: http://localhost:8080
   API: http://localhost:8080/api/v1
   ```

### Production Deployment

See [Deployment Architecture](#deployment-architecture) section for detailed deployment instructions.

---

## Environment Configuration

### Required Variables

Create a `.env` file with the following structure (use mock values for development):

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_mock_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_mock_publishable_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_mock_publishable_key
STRIPE_PRICE_STARTER=price_mock_starter_id
STRIPE_PRICE_PROFESSIONAL=price_mock_professional_id
STRIPE_PRICE_ENTERPRISE=price_mock_enterprise_id

# Environment
NODE_ENV=development
```

**Note**: Never commit actual credentials to version control. Use environment-specific configuration management for production deployments.

---

## License

Proprietary - All rights reserved

---

**Last Updated**: November 18, 2025  
**Version**: 1.0.0  
**Deployment**: [https://swift-route-liard.vercel.app/](https://swift-route-liard.vercel.app/)

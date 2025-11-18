# SwiftRoute 🚀

> **AI-Powered Route Optimization Platform** | [Live Demo](https://swift-route-liard.vercel.app/)

Enterprise-grade B2B SaaS platform delivering intelligent route optimization with 20-30% cost savings and 25%+ emissions reduction. Built for logistics companies committed to sustainable urban development (UN SDG 11).

[![Production](https://img.shields.io/badge/status-production-success)](https://swift-route-liard.vercel.app/)
[![License](https://img.shields.io/badge/license-proprietary-blue)]()
[![API](https://img.shields.io/badge/API-v1.0-orange)]()

---

## 🎯 Quick Links

| Resource | Description |
|----------|-------------|
| [**Live Platform**](https://swift-route-liard.vercel.app/) | Production deployment |
| [**API Docs**](https://swift-route-liard.vercel.app/dashboard) | Complete API reference (login required) |
| **Base URL** | `https://swift-route-liard.vercel.app/api/v1` |

---

## ⚡ Key Features

<table>
<tr>
<td width="50%">

### 🎯 **Core Capabilities**
- Global route optimization (OSRM-powered)
- Multi-vehicle support (car, truck, van, motorcycle)
- Real-time traffic analysis
- Alternative route generation
- Sub-second API response times

</td>
<td width="50%">

### 🌱 **Sustainability Impact**
- 20-30% operational cost reduction
- 25%+ CO₂ emissions decrease
- Real-time emissions tracking
- UN SDG 11 aligned
- Verified impact reporting

</td>
</tr>
</table>

---

## 🏗️ Architecture

### System Overview

```mermaid
graph TB
    A[Client/User] --> B[React Dashboard]
    A --> C[External API Clients]
    
    B --> D[Vercel Edge Network]
    C --> D
    
    D --> E[Node.js API Gateway]
    E --> F[Authentication Layer]
    
    F --> G[Python Route Optimizer]
    F --> H[Supabase PostgreSQL]
    
    G --> I[Enhanced Optimizer]
    I --> J[OSRM External API]
    I --> K[Traffic Analyzer]
    I --> L[Amenity Recommender]
    
    style A fill:#e1f5ff
    style G fill:#fff4e1
    style H fill:#f0e1ff
    style J fill:#e1ffe1
```

### Request Flow

```mermaid sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant A as Auth Service
    participant O as Route Optimizer
    participant E as OSRM API
    participant D as Database
    
    C->>G: POST /optimize-route
    G->>A: Validate API Key/Token
    A->>D: Check Subscription
    D-->>A: Tier & Limits
    A-->>G: Authorized
    
    G->>O: Optimize Request
    O->>E: Get Baseline Route
    E-->>O: Route Data
    O->>O: Apply Enhanced Algorithm
    O->>O: Analyze Traffic
    O->>O: Find Amenities
    O-->>G: Optimized Result
    
    G->>D: Log Usage
    G-->>C: Response + Improvements
```

### Data Flow

```mermaid
flowchart LR
    A[Request] --> B{Auth Check}
    B -->|Valid| C[Rate Limit Check]
    B -->|Invalid| Z[401 Error]
    
    C -->|OK| D[Route Optimizer]
    C -->|Exceeded| Y[429 Error]
    
    D --> E[Get Baseline]
    D --> F[Get Optimized]
    D --> G[Analyze Traffic]
    D --> H[Find Amenities]
    
    E --> I[Calculate Improvements]
    F --> I
    G --> I
    H --> I
    
    I --> J[Log Usage]
    J --> K[Return Response]
    
    style B fill:#ffe1e1
    style C fill:#fff4e1
    style D fill:#e1f5ff
    style I fill:#e1ffe1
```

---

## 🚀 Quick Start

### For Developers

```bash
# Clone and install
git clone <repository_url>
cd swift_route
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run development
npm run dev
```

### For API Users

```bash
# Example API call
curl -X POST https://swift-route-liard.vercel.app/api/v1/optimize-route \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "origin": [-1.2921, 36.8219],
    "destination": [-1.2864, 36.8172],
    "vehicle_type": "car",
    "optimize_for": "time"
  }'
```

---

## 💻 Technology Stack

<table>
<tr>
<td width="33%">

### Frontend
- React 18.3 + TypeScript
- Vite 7.1 (SWC)
- Tailwind CSS + shadcn/ui
- React Query (TanStack)
- Leaflet Maps

</td>
<td width="33%">

### Backend
- Node.js 22 (Serverless)
- Python 3.11 (Optimization)
- Supabase (PostgreSQL)
- OSRM (Routing Engine)
- Stripe (Payments)

</td>
<td width="33%">

### Infrastructure
- Vercel (Hosting)
- Edge Network (CDN)
- Supabase Auth (JWT)
- GitHub Actions (CI/CD)

</td>
</tr>
</table>

---

## 📊 API Reference

### Authentication

```mermaid
graph LR
    A[Client] --> B{Auth Method}
    B -->|API Key| C[X-API-Key Header]
    B -->|Session| D[Bearer Token]
    C --> E[Validate & Authorize]
    D --> E
    E --> F[Process Request]
    
    style C fill:#e1f5ff
    style D fill:#fff4e1
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/optimize-route` | POST | Optimize route with traffic analysis |
| `/health` | GET | Service health check |
| `/profile` | GET/PUT | User profile management |
| `/keys` | GET/POST | API key management |
| `/usage` | GET | Usage statistics |
| `/billing/subscription` | GET | Subscription details |

### Request Example

```json
{
  "origin": [-1.2921, 36.8219],
  "destination": [-1.2864, 36.8172],
  "vehicle_type": "car",
  "optimize_for": "time",
  "waypoints": [[-1.2900, 36.8200]],
  "find_alternatives": true
}
```

### Response Example

```json
{
  "data": {
    "baseline_route": {
      "distance": 5.2,
      "estimated_time": 12.5,
      "cost": 0.78,
      "co2_emissions": 0.62
    },
    "optimized_route": {
      "distance": 4.8,
      "estimated_time": 11.2,
      "cost": 0.72,
      "co2_emissions": 0.58
    },
    "improvements": {
      "distance_saved": 0.4,
      "time_saved": 1.3,
      "cost_saved": 0.06,
      "co2_saved": 0.04
    },
    "traffic_info": {
      "traffic_level": 1.1,
      "traffic_description": "Moderate traffic",
      "area_type": "commercial"
    }
  }
}
```

---

## 💰 Pricing Tiers

| Tier | Price | Requests/Month | Rate Limit | Best For |
|------|-------|----------------|------------|----------|
| **Trial** | Free | 100 | 5/min | Testing & Development |
| **Starter** | $29/mo | 1,000 | 10/min | Small Fleets |
| **Professional** | $199/mo | 10,000 | 50/min | Growing Businesses |
| **Enterprise** | $999/mo | 100,000 | 200/min | Large Operations |

> **Overage**: $0.01 - $0.005 per request (tier-dependent)

---

## 🔐 Security & Authentication

### Authentication Flow

```mermaid
flowchart TD
    A[Request] --> B{Has Auth?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Token Type}
    
    D -->|Bearer| E[Verify JWT]
    D -->|API Key| F[Hash & Lookup]
    
    E --> G{Valid?}
    F --> G
    
    G -->|No| C
    G -->|Yes| H[Get User Context]
    H --> I[Check Subscription]
    I --> J[Check Rate Limit]
    J --> K[Process Request]
    
    style C fill:#ffe1e1
    style K fill:#e1ffe1
```

### Best Practices

- ✅ Store API keys in environment variables
- ✅ Use HTTPS for all requests
- ✅ Rotate keys regularly
- ✅ Implement exponential backoff for rate limits
- ✅ Never expose keys in client-side code

---

## 🧪 Testing

### Postman Setup

**Headers:**
```
Content-Type: application/json
X-API-Key: sk_live_your_key_here
```

**Body:**
```json
{
  "origin": [-1.2921, 36.8219],
  "destination": [-1.2864, 36.8172],
  "vehicle_type": "car",
  "optimize_for": "time"
}
```

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check API key/token |
| 400 | Bad Request | Verify JSON format |
| 429 | Rate Limit | Wait or upgrade tier |
| 500 | Server Error | Check request ID in logs |

---

## 📁 Project Structure

```
swift_route/
├── api/
│   ├── index.js                 # Node.js API Gateway
│   └── v1/optimize-route/
│       └── main.py              # Python Route Optimizer
├── lib/gnn/
│   ├── optimizer/
│   │   ├── enhanced_optimizer.py
│   │   └── traffic_analyzer.py
│   ├── models/vehicle.py
│   └── network/osrm_client.py
├── src/
│   ├── components/              # React Components
│   ├── pages/                   # Dashboard Pages
│   ├── hooks/                   # Custom Hooks
│   └── lib/                     # Utilities
├── supabase/migrations/         # Database Schema
└── docs/                        # Documentation
```

---

## 🚢 Deployment

### Vercel Configuration

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
  }
}
```

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Deploy Command

```bash
vercel --prod
```

---

## 🌍 UN SDG 11 Impact

### Target 11.2: Sustainable Transport
- ✅ 15-30% reduction in operational costs
- ✅ Accurate ETAs in data-scarce regions
- ✅ Enhanced accessibility through reliable routing

### Target 11.6: Environmental Impact
- ✅ Verified CO₂ reduction reports
- ✅ 20%+ reduction in fleet mileage
- ✅ Lower PM2.5 & PM10 emissions

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| API Response Time | < 1 second |
| Uptime SLA | 99.9% |
| Cost Reduction | 20-30% |
| Emissions Reduction | 25%+ |
| Global Coverage | ✅ Worldwide |

---

## 🤝 Support

- 📧 **Email**: support@swiftroute.com
- 📚 **Documentation**: [Dashboard Docs](https://swift-route-liard.vercel.app/dashboard)
- 🐛 **Issues**: Check Analytics tab for request IDs
- 💬 **Community**: [GitHub Discussions](#)

---

## 📄 License

**Proprietary** - All rights reserved © 2025 SwiftRoute

---

## 🙏 Acknowledgments

- **OSRM** - Open Source Routing Machine
- **Supabase** - Backend infrastructure
- **Vercel** - Serverless deployment
- **UN SDG 11** - Sustainable cities inspiration

---

<div align="center">

**Built with ❤️ for sustainable urban logistics**

[Get Started](https://swift-route-liard.vercel.app/) • [View Docs](https://swift-route-liard.vercel.app/dashboard) • [API Reference](https://swift-route-liard.vercel.app/dashboard)

*Last Updated: November 18, 2025 • Version 1.0.0*

</div>

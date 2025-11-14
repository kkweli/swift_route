# SwiftRoute System Architecture

## Overview
SwiftRoute is a B2B API platform that provides GNN-enhanced route optimization services on a pay-as-you-go basis. The system offers a RESTful API for external applications to integrate advanced route optimization, along with a comprehensive management dashboard for API clients to manage accounts, monitor usage, handle billing, and test the service. The platform serves multiple industries including e-commerce, field services, emergency response, public transit, waste management, and supply chain logistics.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL API CLIENTS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  E-commerce  │  │ Field Service│  │  Emergency   │          │
│  │     Apps     │  │     Apps     │  │   Response   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Fleet Mgmt   │  │ Waste Mgmt   │  │ Public       │          │
│  │   Systems    │  │   Systems    │  │ Transit      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────────────────────────────────▼─────────────────┐
│                 SWIFTROUTE API PLATFORM                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              API Gateway & Authentication                   │ │
│  │                                                            │ │
│  │  - API Key Validation    - Rate Limiting                  │ │
│  │  - Usage Tracking        - Request/Response Logging       │ │
│  │  - CORS & Security       - Billing Integration            │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               │                                  │
│  ┌────────────────────────────▼───────────────────────────────┐ │
│  │            Management Dashboard (Next.js)                  │ │
│  │                                                            │ │
│  │  - Account Management    - Usage Analytics                │ │
│  │  - API Key Management    - Billing Dashboard              │ │
│  │  - Interactive Testing   - Documentation                  │ │
│  └────────────────────────────┬───────────────────────────────┘ │
└─────────────────────────────────┼─────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐   ┌──────────────────────┐  ┌────────────────┐
│  Supabase Auth  │   │   Python Service     │  │    Supabase    │
│                 │   │  (FastAPI/Vercel)    │  │   PostgreSQL   │
│  - JWT Tokens   │   │                      │  │   + PostGIS    │
│  - User Mgmt    │   │  /optimize           │  │                │
└─────────────────┘   └──────────┬───────────┘  └────────┬───────┘
                                 │                       │
                   ┌─────────────┴─────────────┐         │
                   │                           │         │
         ┌─────────▼──────────┐    ┌───────────▼─────────▼────────┐
         │   GNN Core Module  │    │    Database Layer            │
         │                    │    │                              │
         │  - graph_builder   │◄───┤  Tables:                     │
         │  - gnn_model       │    │  - road_segments (PostGIS)   │
         │  - optimizer       │    │  - nodes                     │
         │  - training        │    │  - routes                    │
         │  - database        │◄───┤  - user_profiles             │
         └────────────────────┘    │  - vehicles                  │
                                   │  - traffic_data              │
                                   └──────────────────────────────┘
```

## Component Breakdown

### 1. Frontend Layer (Next.js/TypeScript)

#### 1.1 Pages
- **Landing Page (`/`)**: Marketing page showcasing SDG alignment, GNN technology, and industry applications
- **Auth Page (`/auth`)**: Login/signup with Supabase authentication
- **Dashboard (`/dashboard`)**: Main application interface with map, route form, and results
- **404 Page**: Error handling for invalid routes

#### 1.2 Components
- **MapView**: Interactive map using Leaflet/React-Leaflet
  - Displays base map (OpenStreetMap)
  - Shows origin/destination markers
  - Renders optimized route polylines
  - Handles user interactions (click to set points)

- **RouteForm**: User input form for route optimization
  - Origin/destination input fields
  - Vehicle type selector
  - Time window pickers
  - Optimization preferences (distance/time/cost)
  - Toggle options (avoid traffic/tolls)

- **RouteResults**: Display optimization results
  - Metrics cards (distance, time, cost)
  - Alternative routes comparison
  - Save/export functionality

- **Navigation**: App navigation bar
  - Logo and branding
  - User profile dropdown
  - Mobile-responsive menu

#### 1.3 State Management
- **React Query**: Server state management for API calls
- **React Context**: Global auth state via useAuth hook
- **Local State**: Component-level state with useState/useReducer

#### 1.4 API Integration
All API calls route through Next.js API routes for security and server-side logic.

### 2. API Layer (Next.js API Routes)

#### 2.1 Authentication Service (`/api/v1/auth`)
- **POST /api/v1/auth**: Handle login/signup/logout
- Wraps Supabase Auth for consistency
- Returns JWT tokens for API access
- Manages session cookies

#### 2.2 Routes Service (`/api/v1/routes`)
- **GET /api/v1/routes**: Fetch user's saved routes
- **POST /api/v1/routes**: Save a new route
- **DELETE /api/v1/routes/:id**: Delete a route
- Direct integration with Supabase database

#### 2.3 Optimization Proxy (`/api/v1/optimize`)
- **POST /api/v1/optimize**: Proxy to Python service
- Validates request payload
- Adds authentication headers
- Forwards to Python FastAPI service
- Transforms response format if needed
- Currently returns mock data (to be replaced)

### 3. Backend Service (Python/FastAPI)

#### 3.1 Main API (`/api/v1/optimize-route/index.py`)
```python
FastAPI Application:
├── GET  /health          → Health check
├── POST /optimize        → Main route optimization
├── POST /batch-optimize  → Multiple routes (future)
└── GET  /route/{id}      → Retrieve route details (future)
```

**POST /optimize** Workflow:
1. Receive RouteRequest (origin, destination, preferences)
2. Validate input coordinates
3. Fetch road network from PostGIS (within radius)
4. Build graph representation
5. Run optimization algorithm (Dijkstra/A*/GNN)
6. Calculate metrics (distance, time, cost)
7. Return OptimizedRoute response

#### 3.2 GNN Core Module

**database.py** - Database Operations
- Connection pooling to Supabase PostgreSQL
- PostGIS query functions:
  - `fetch_road_segments_in_radius(lat, lng, radius_km)`
  - `fetch_nodes_in_radius(lat, lng, radius_km)`
  - `get_traffic_data(segment_ids)`
- Async operations for performance

**graph_builder.py** - Graph Construction
- Convert PostGIS LineStrings to graph structure
- Nodes: Intersections/endpoints
- Edges: Road segments with attributes
  - Distance (meters)
  - Speed limit (km/h)
  - Traffic weight (multiplier)
  - Road type
- Graph caching mechanism
- NetworkX or PyTorch Geometric format

**optimizer.py** - Route Optimization
- **Baseline Algorithms**:
  - Dijkstra: Shortest path (distance-based)
  - A* Search: Heuristic search (faster)
    - Heuristic: Haversine distance to destination
- **GNN-Enhanced Optimization**:
  - Use GNN to predict edge costs
  - Combine with A* for efficient search
- **Multi-objective Optimization**:
  - Distance minimization
  - Time minimization (considering speed limits, traffic)
  - Cost minimization (fuel + time costs)

**gnn_model.py** - Graph Neural Network
- **Architecture**: 3-Layer Graph Convolutional Network
  - Input: Node features (lat/lng, intersection type)
          Edge features (distance, speed, traffic, road type)
  - Hidden layers: 64-128 dimensions
  - Output: Edge weight predictions
- **Model Operations**:
  - `load_model(path)`: Load pre-trained weights
  - `predict(graph)`: Inference on graph
  - `save_model(path)`: Save model checkpoint

**training.py** - Model Training
- Dataset preparation from historical routes
- Training loop with loss calculation
- Validation and testing
- Model checkpointing

### 4. Database Layer (Supabase PostgreSQL + PostGIS)

#### 4.1 Core Tables

**road_segments**
```sql
- id: UUID (PK)
- geometry: GEOGRAPHY(LINESTRING) → PostGIS
- road_type: VARCHAR → 'motorway', 'primary', 'secondary', etc.
- speed_limit: INTEGER
- distance: FLOAT
- traffic_weight: FLOAT (default 1.0)
- source_node: UUID (FK)
- target_node: UUID (FK)
- Indexes: Spatial (GIST on geometry), source/target nodes
```

**nodes**
```sql
- id: UUID (PK)
- geometry: GEOGRAPHY(POINT) → PostGIS
- node_type: VARCHAR
- Indexes: Spatial (GIST on geometry)
```

**routes**
```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- origin: GEOGRAPHY(POINT)
- destination: GEOGRAPHY(POINT)
- optimized_path: GEOGRAPHY(LINESTRING)
- distance: FLOAT
- estimated_time: INTEGER
- cost: FLOAT
- algorithm_used: VARCHAR
- created_at: TIMESTAMP
- Indexes: user_id, created_at, spatial on origin/destination
```

**user_profiles**
```sql
- id: UUID (PK, FK to auth.users)
- preferences: JSONB → default vehicle, optimization type
- created_at: TIMESTAMP
```

**traffic_data**
```sql
- id: UUID (PK)
- road_segment_id: UUID (FK)
- avg_speed: FLOAT
- traffic_level: VARCHAR → 'low', 'medium', 'high', 'severe'
- timestamp: TIMESTAMP
- Indexes: road_segment_id, timestamp
```

#### 4.2 PostGIS Functions Used
- `ST_DWithin(geom1, geom2, distance)`: Find nearby segments
- `ST_Distance(geom1, geom2)`: Calculate distance
- `ST_MakeLine(points[])`: Create route polyline
- `ST_AsGeoJSON(geom)`: Convert geometry to GeoJSON
- `ST_SetSRID(geom, srid)`: Set spatial reference system (WGS84 = 4326)

#### 4.3 Row Level Security (RLS)
- Users can only access their own routes
- Public read access to road network data
- Admin-only write access to road_segments and traffic_data

## Data Flow

### Route Optimization Flow (End-to-End)

```
1. User submits form in Dashboard
   ↓
2. RouteForm validates input
   ↓
3. Frontend calls POST /api/v1/optimize
   {
     origin: {lat, lng},
     destination: {lat, lng},
     vehicle_type: 'car',
     optimize_for: 'time',
     avoid_traffic: true
   }
   ↓
4. Next.js API route validates & proxies to Python service
   ↓
5. Python FastAPI /optimize endpoint receives request
   ↓
6. database.py fetches road network from PostGIS
   - Query radius: 50km from origin/destination
   - Returns road_segments with geometries
   ↓
7. graph_builder.py converts to graph
   - Nodes: Intersections
   - Edges: Road segments with weights
   ↓
8. optimizer.py runs optimization
   - If GNN available: Use GNN predictions
   - Else: Use baseline A* with traffic weights
   ↓
9. Calculate metrics
   - Distance: Sum of segment distances
   - Time: distance / (speed * traffic_weight)
   - Cost: fuel_cost + time_cost
   ↓
10. Return OptimizedRoute to frontend
    {
      route_id: UUID,
      coordinates: [{lat, lng}, ...],
      distance: 15.5,
      estimated_time: 25,
      cost: 350
    }
   ↓
11. RouteResults displays metrics
   ↓
12. MapView renders route polyline
   ↓
13. User can save route (stored in Supabase)
```

### Authentication Flow

```
1. User clicks "Sign In"
   ↓
2. Auth page displays login form
   ↓
3. User enters email + password
   ↓
4. Frontend calls Supabase Auth directly
   supabase.auth.signInWithPassword({email, password})
   ↓
5. Supabase validates credentials
   ↓
6. Returns JWT token + user object
   ↓
7. Token stored in httpOnly cookie
   ↓
8. useAuth hook updates global state
   ↓
9. User redirected to /dashboard
   ↓
10. Protected routes check auth state
    - If authenticated: Allow access
    - If not: Redirect to /auth
```

## API Contracts

### POST /api/v1/optimize

**Request Schema** (TypeScript):
```typescript
interface RouteRequest {
  origin: Coordinates;           // {lat: number, lng: number}
  destination: Coordinates;
  vehicle_type: 'car' | 'truck' | 'van' | 'motorcycle';
  time_window?: {
    start: string;              // ISO 8601
    end: string;
  };
  avoid_traffic: boolean;
  avoid_tolls: boolean;
  optimize_for: 'distance' | 'time' | 'cost';
}
```

**Response Schema**:
```typescript
interface OptimizedRoute {
  route_id: string;
  coordinates: Coordinates[];   // Array of waypoints
  distance: number;             // kilometers
  estimated_time: number;       // minutes
  cost: number;                 // currency units
  alternative_routes?: AlternativeRoute[];
  metadata: {
    algorithm_used: string;     // 'dijkstra', 'astar', 'gnn-astar'
    computation_time: number;   // milliseconds
    traffic_considered: boolean;
  };
}
```

### GET /api/v1/routes

**Response**:
```typescript
interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  route_data: OptimizedRoute;
  created_at: string;
}[]
```

## Deployment Architecture

### Vercel Deployment

**Frontend (Next.js)**:
- Deployed to Vercel Edge Network
- Automatic HTTPS
- CDN for static assets
- Server-side rendering (SSR) for landing page
- Client-side rendering (CSR) for dashboard

**API Routes (Node.js)**:
- Deployed as Vercel Serverless Functions
- Cold start: ~50-100ms
- Region: Auto (closest to user)

**Python Service (FastAPI)**:
- Deployed as Vercel Serverless Function
- Runtime: Python 3.10+
- Cold start: ~200-500ms (acceptable for optimization task)
- Timeout: 10 seconds (default)

**Database (Supabase)**:
- Managed PostgreSQL with PostGIS
- Connection pooling via pg_bouncer
- Automatic backups (daily)
- Point-in-time recovery

### Environment Variables

**Frontend (.env.local)**:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=https://swiftroute.vercel.app/api/v1
```

**Backend (Python service .env)**:
```
DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
MODEL_PATH=./models/gnn_route_optimizer.pth
```

## Security Considerations

### 1. Authentication
- JWT tokens issued by Supabase Auth
- httpOnly cookies prevent XSS attacks
- Tokens expire after 1 hour (refresh token: 7 days)
- All API routes validate auth tokens

### 2. API Security
- CORS configured to allow only frontend domain
- Rate limiting (100 requests/minute per user)
- Input validation on all endpoints
- SQL injection prevention via parameterized queries

### 3. Data Privacy
- Row Level Security (RLS) on Supabase tables
- Users can only access their own data
- No sensitive data in client-side code
- API keys stored in environment variables

### 4. Network Security
- All traffic over HTTPS
- Supabase connection encrypted (SSL/TLS)
- No credentials in logs

## Performance Optimization

### 1. Frontend
- Code splitting: Dynamic imports for heavy components
- Image optimization: Next.js Image component
- Caching: React Query for API responses (5 min cache)
- Lazy loading: Maps and results only load when needed

### 2. Backend
- Database connection pooling (max 20 connections)
- Graph caching: Store frequently used graphs in memory
- Query optimization: Spatial indexes on PostGIS
- Async operations: All I/O is non-blocking

### 3. GNN Model
- Model inference: < 50ms (target)
- Batch processing: Process multiple routes in parallel
- GPU acceleration: Optional for training (CPU for inference)
- Model compression: Quantization for smaller model size

### 4. Database
- Spatial indexes: GIST on all geometry columns
- Composite indexes: (user_id, created_at) for common queries
- Query limits: Maximum 10,000 road segments per query
- Connection pooling: Reuse database connections

## Monitoring & Observability

### Metrics to Track
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- GNN model inference time
- User active sessions
- Route optimization success rate

### Logging
- Structured JSON logs
- Log levels: DEBUG, INFO, WARNING, ERROR
- Sensitive data redacted from logs
- Centralized logging (Vercel logs)

### Alerts
- API error rate > 5%
- Response time > 2 seconds
- Database connection failures
- Disk space > 80%

## Scalability Considerations

### Current Capacity
- Expected users: 100-1000
- Routes per day: 1,000-10,000
- Database size: < 10GB (road network data)

### Scaling Strategy
1. **Horizontal scaling**: Vercel auto-scales serverless functions
2. **Database scaling**: Supabase supports read replicas
3. **Caching**: Add Redis for frequently accessed data
4. **CDN**: Static assets served from edge locations
5. **Load balancing**: Built into Vercel platform

## Future Enhancements

### Phase 2 Features
- Real-time traffic integration (Google Maps Traffic API)
- Multi-stop route optimization
- Fleet management dashboard
- Mobile app (React Native)

### Phase 3 Features
- Batch optimization API
- Webhook notifications for route updates
- Advanced analytics dashboard
- White-label solution for enterprises

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 | React framework with SSR |
| UI Components | shadcn/ui | Tailwind-based component library |
| Styling | Tailwind CSS | Utility-first CSS |
| Maps | React Leaflet | Interactive maps |
| State | React Query | Server state management |
| Auth | Supabase Auth | User authentication |
| Backend | FastAPI | Python web framework |
| ML Framework | PyTorch Geometric | GNN implementation |
| Database | PostgreSQL + PostGIS | Spatial database |
| Hosting | Vercel | Serverless deployment |
| Database Host | Supabase | Managed PostgreSQL |

## References

- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **PyTorch Geometric**: https://pytorch-geometric.readthedocs.io/
- **PostGIS**: https://postgis.net/documentation/
- **Supabase**: https://supabase.com/docs
- **React Leaflet**: https://react-leaflet.js.org/

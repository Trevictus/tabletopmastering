# Technical Decisions

## Architecture Overview

Tabletop Mastering follows a modern client-server architecture with clear separation of concerns, containerization, and comprehensive observability.

---

## Backend Architecture

### Node.js + Express

**Decision:** Use Node.js 20+ with Express.js as the API framework

**Rationale:**
- Lightweight and fast for REST API operations
- Strong ecosystem with mature middleware options
- JavaScript consistency across full stack
- Excellent support for asynchronous operations
- Good performance for I/O-bound operations (database queries, external API calls)

### MongoDB + Mongoose ODM

**Decision:** Use MongoDB 8.0 with Mongoose for data persistence

**Rationale:**
- Document-based model aligns well with gaming group structures
- Flexible schema supports diverse game metadata from BoardGameGeek
- Mongoose provides validation, hooks, and relationships
- Horizontal scalability through replication sets
- GDPR compliance through document-level deletion

### JWT Authentication

**Decision:** Use JSON Web Tokens with Bearer scheme for stateless authentication

**Rationale:**
- Stateless authentication suits distributed systems and horizontal scaling
- No server-side session storage required
- Works seamlessly with single-page applications
- Industry standard with excellent library support
- Better for mobile and third-party API integration

### Password Hashing with bcryptjs

**Decision:** Use bcryptjs for password hashing instead of plaintext or simple hashing

**Rationale:**
- Adaptive cost factor protects against future computational advances
- Industry standard for secure password storage
- Protects against rainbow table attacks
- Prevents timing attacks through consistent hashing time

### Rate Limiting

**Decision:** Implement express-rate-limit on authentication endpoints

**Rationale:**
- Prevents brute force attacks on login endpoints
- Protects against credential stuffing
- Reduces server load from malicious requests
- Standard security practice for public APIs

### Trust Proxy Configuration

**Decision:** Configure Express to trust the first proxy (nginx reverse proxy)

**Rationale:**
- Enables correct client IP detection behind reverse proxy
- Required for rate limiting to function properly
- Maintains accurate logging and analytics
- Supports production deployment patterns

---

## Security

### Helmet.js HTTP Security Headers

**Decision:** Use Helmet.js middleware for HTTP security headers

**Rationale:**
- Prevents clickjacking attacks via X-Frame-Options
- Protects against MIME type sniffing
- Enables Content Security Policy
- Reduces attack surface with minimal configuration
- Recommended by OWASP for Express applications

### CORS Protection

**Decision:** Enable CORS with explicit origin whitelisting

**Rationale:**
- Prevents cross-origin requests from unauthorized domains
- Protects against cross-site request forgery
- Allows frontend to communicate safely with backend
- Configurable per environment

### Input Validation

**Decision:** Implement validation on all API endpoints using express-validator

**Rationale:**
- Prevents injection attacks (SQL, NoSQL, command injection)
- Ensures data integrity at API boundary
- Provides consistent error messaging
- Fails fast before database operations

---

## Frontend Architecture

### React 19 + Vite 7

**Decision:** Use React 19 with Vite 7 as build tool and development server

**Rationale:**
- React 19 provides latest features and performance improvements
- Vite offers extremely fast build times and instant HMR
- Modern ESM-first approach
- Significantly faster than webpack-based solutions
- Better development experience with instant feedback

### React Router v7

**Decision:** Use React Router v7 for client-side routing

**Rationale:**
- Industry standard routing library for React
- Supports nested routes and dynamic segments
- Enables lazy loading of components
- Provides URL synchronization with application state
- Supports data loaders and actions patterns

### Zustand for State Management

**Decision:** Use Zustand for global state instead of Redux or Context API

**Rationale:**
- Minimal boilerplate compared to Redux
- Smaller bundle size than Redux
- Simpler learning curve than Redux
- Direct state mutations without actions/reducers
- Excellent TypeScript support
- Lightweight alternative to Context API for complex state

### Zustand Stores

**Decision:** Separate stores for authentication, groups, and notifications

**Rationale:**
- Clear separation of concerns
- Prevents unnecessary re-renders across unrelated state
- Makes state management predictable and testable
- Easier to debug with isolated stores
- Scales better than single monolithic store

### Axios with Interceptors

**Decision:** Use Axios with request/response interceptors for API communication

**Rationale:**
- Automatic request/response transformation
- Built-in request cancellation support
- Centralized error handling through interceptors
- Automatic token injection in Authorization headers
- Request timeout management
- Better error messages than fetch API

### SessionStorage for Auth Tokens

**Decision:** Store authentication tokens in sessionStorage

**Rationale:**
- Not accessible via JavaScript if sameSite cookies not used
- Cleared when browser tab closes
- Protects against XSS attacks better than localStorage
- Suitable for single-window application usage
- Token automatically removed on logout

---

## API Integration

### BoardGameGeek API Integration

**Decision:** Implement abstract BGG service layer with mock support for testing

**Rationale:**
- Separates external API concerns from business logic
- Mock service allows offline testing and CI/CD without external dependencies
- Prevents rate limiting issues during development
- Can easily switch between real and mock implementations
- Supports development workflow with `dev:mock` script

---

## DevOps & Containerization

### Docker & Docker Compose

**Decision:** Use Docker and Docker Compose for development and production environments

**Rationale:**
- Ensures consistency between development and production
- Easy onboarding for new developers
- Simplifies dependency management
- Reproducible builds and deployments
- Supports multiple services (frontend, backend, database, monitoring)

### Multi-stage Docker Builds

**Decision:** Use multi-stage Dockerfile with separate development and production targets

**Rationale:**
- Reduces final image size by excluding build dependencies
- Maintains consistency between environments
- Faster builds by leveraging layer caching
- Easier to switch between development and production modes

### Nginx Reverse Proxy

**Decision:** Use Nginx as reverse proxy for frontend and backend

**Rationale:**
- Static file serving for React SPA
- API request routing to backend
- SSL/TLS termination
- Load balancing capabilities
- Request compression and caching

### Container Networking

**Decision:** Use Docker Compose networks for service communication

**Rationale:**
- Services communicate by hostname within network
- Isolation from host network
- Simplified connection strings (e.g., mongodb:27017)
- Better security than exposing all ports

---

## Observability & Monitoring

### Prometheus for Metrics

**Decision:** Use Prometheus for metrics collection with prom-client library

**Rationale:**
- Industry standard for metrics collection
- Efficient time-series database
- Simple text-based exposition format
- Built-in alerting capabilities
- Large ecosystem of exporters

### Grafana for Visualization

**Decision:** Use Grafana for visualizing Prometheus metrics

**Rationale:**
- Powerful dashboard creation
- Pre-built datasource support for Prometheus
- Alert notification integration
- User-friendly interface
- Large community and template library

### Loki & Promtail for Logs

**Decision:** Use Loki for log aggregation and Promtail for log collection

**Rationale:**
- Purpose-built for Prometheus ecosystem
- Efficient log storage and querying
- Label-based log indexing (not full-text)
- Low resource consumption
- Easy integration with Docker Compose

### Sentry for Error Tracking

**Decision:** Implement Sentry on both backend and frontend for error tracking

**Rationale:**
- Centralized error monitoring across full stack
- Automatic error capture with context
- Release tracking and version management
- Sourcemap support for production debugging
- Team collaboration and issue assignment

### Morgan HTTP Logging

**Decision:** Use Morgan middleware for HTTP request logging

**Rationale:**
- Standard request/response logging
- Multiple predefined formats for different use cases
- Structured logging integration
- Low performance overhead
- Widely used and understood by developers

---

## Code Quality & Development

### ESLint for Code Linting

**Decision:** Use ESLint with shared configuration across backend and frontend

**Rationale:**
- Prevents common JavaScript errors
- Enforces code style consistency
- Catches potential bugs early
- Highly configurable for project needs
- Integrates with development tools and CI/CD

### Prettier for Code Formatting

**Decision:** Use Prettier for automatic code formatting

**Rationale:**
- Removes debates about code style
- Consistent formatting across codebase
- Works with ESLint without conflicts
- Fast and deterministic formatting
- Pre-commit integration support

### Conventional Commits

**Decision:** Use conventional commits format for commit messages

**Rationale:**
- Enables automated changelog generation
- Clear semantic versioning based on commit types
- Improves code review clarity
- Supports commit filtering and searching
- Industry standard for modern projects

### Environment-based Configuration

**Decision:** Use .env files with dotenv for configuration management

**Rationale:**
- Separates sensitive data from version control
- Environment-specific configurations
- Easy local development setup
- Required for Docker containerization
- Supports both development and production workflows

---

## Data Management

### Lean Queries for Performance

**Decision:** Use .lean() queries in MongoDB for read-only operations

**Rationale:**
- Returns plain JavaScript objects instead of Mongoose documents
- Reduces memory usage significantly
- Improves query performance
- Appropriate for read-only operations where document methods not needed
- Better for large result sets

### Database Indexing

**Decision:** Implement strategic indexes on frequently queried fields

**Rationale:**
- Improves query performance
- Essential for large collections
- Reduces database load
- Critical for user/group lookups
- Prevents N+1 query problems

---

## GDPR Compliance

**Decision:** Implement data deletion functionality at application level

**Rationale:**
- Respects user right to erasure
- Cascading deletes for related data
- Audit trail capability
- Compliance with data protection regulations
- User privacy protection

---

## Testing Strategy

### Mock Services for External APIs

**Decision:** Provide mock implementations of external services (BGG API)

**Rationale:**
- Enables offline testing
- No external service dependency in CI/CD
- Prevents rate limiting during development
- Faster test execution
- Reliable and repeatable test results

### Script-based Testing

**Decision:** Use bash scripts for integration testing

**Rationale:**
- Tests real API endpoints and data flow
- Validates integration between services
- Can be run in CI/CD pipeline
- Language-agnostic approach
- Clear test documentation

---

## Performance Optimizations

### Request Compression

**Decision:** Enable gzip compression for HTTP responses

**Rationale:**
- Reduces bandwidth usage significantly
- Improves page load times
- Minimal CPU overhead with nginx
- Transparent to client applications
- Best practice for production deployments

### Lazy Code Splitting

**Decision:** Implement lazy loading for React components

**Rationale:**
- Reduces initial bundle size
- Improves time to interactive
- Better caching strategies per route
- Scales to large applications
- Vite supports automatic code splitting

---

## Development Workflow

### Nodemon for Auto-reload

**Decision:** Use Nodemon for automatic server restart during development

**Rationale:**
- Instant feedback on code changes
- Improves developer productivity
- Simple configuration
- Standard practice for Node.js development
- No need for manual restarts

### Environment Modes

**Decision:** Support development, test, and production modes with environment variables

**Rationale:**
- Different configurations per environment
- Mock services in development/test
- Production hardening in production
- Safe defaults prevent data loss
- Simplifies deployment process

---

## Summary

This technical architecture prioritizes:

1. **Security** - Multiple layers of protection (JWT, CORS, rate limiting, validation)
2. **Scalability** - Stateless authentication, horizontal scaling capability
3. **Observability** - Comprehensive monitoring from logs to metrics to errors
4. **Developer Experience** - Quick feedback loops, clear abstractions, standard tools
5. **Maintainability** - Clear separation of concerns, consistent patterns, good tooling
6. **Performance** - Efficient queries, code splitting, compression, caching
7. **Compliance** - GDPR compliance, data protection, audit capabilities

The decisions emphasize proven technologies with strong communities, avoiding experimental or niche tools in favor of industry standards that maximize team productivity and system reliability.

# Changelog

All notable changes to Tabletop Mastering will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-29

### Added

- **Authentication System**
  - User registration and login with JWT tokens
  - Password hashing with bcrypt
  - Token expiration and refresh handling

- **Group Management**
  - Create, edit, and delete gaming groups
  - Invite members via unique invite codes
  - Role-based permissions (owner, admin, member)

- **Game Catalog**
  - BoardGameGeek integration for game search
  - Custom game creation support
  - Game image upload functionality
  - Personal and group game libraries

- **Match Tracking**
  - Record game sessions with date and participants
  - Track scores and winners
  - Match history with filtering options

- **Statistics & Rankings**
  - Global and group-specific leaderboards
  - Player performance statistics
  - Win rate and points calculations

- **Observability**
  - Prometheus metrics endpoint
  - Grafana dashboards for monitoring
  - Loki for log aggregation
  - Sentry integration for error tracking

- **Security**
  - Helmet.js for HTTP security headers
  - CORS configuration
  - Rate limiting (API and authentication)
  - Input validation and sanitization

- **DevOps**
  - Docker and Docker Compose setup
  - GitHub Actions CI/CD pipeline
  - Trivy security scanning
  - Dependabot for dependency updates

- **Documentation**
  - Comprehensive API documentation
  - User guide
  - Security policy (SECURITY.md)

### Security

- All API endpoints protected with JWT authentication
- Passwords hashed using bcrypt with cost factor 10
- Rate limiting on authentication endpoints (10 attempts/hour)
- HTTPS enforced in production

---

## [Unreleased]

### Planned

- Email verification for new accounts
- Password reset functionality
- Push notifications for game invites
- Mobile-responsive improvements
- Multi-language support (i18n)

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-29

Initial release of Tabletop Mastering.

### Added

**User Management**
- Registration and login with JWT authentication
- Password hashing with bcrypt
- Profile management with GDPR-compliant data export

**Gaming Groups**
- Create and manage gaming groups
- Invite members via unique codes
- Role-based permissions (owner, admin, member)

**Game Library**
- Search BoardGameGeek's catalog
- Add custom games
- Upload game images
- Manage personal and group game collections

**Match Tracking**
- Record game sessions with participants
- Track scores and winners
- View match history with filters

**Statistics**
- Global and group-specific leaderboards
- Player performance metrics
- Win rates and points tracking

**Monitoring & Observability**
- Prometheus metrics
- Grafana dashboards
- Loki log aggregation
- Sentry error tracking

**Security**
- Helmet.js security headers
- CORS protection
- Rate limiting (strict limits on auth endpoints)
- Input validation

**DevOps**
- Docker and Docker Compose setup
- GitHub Actions CI/CD
- Trivy security scanning
- Dependabot dependency updates

**Documentation**
- API documentation
- User guide
- Security policy

---

## [Unreleased]

### Planned

- Email verification for new accounts
- Password reset functionality
- Mobile-responsive improvements
- Multi-language support (i18n)

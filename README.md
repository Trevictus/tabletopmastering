# 🎲 Tabletop Mastering

https://tabletopmastering.games/

> Web platform for comprehensive management of tabletop gaming sessions and groups

[![Node](https://img.shields.io/badge/Node.js-20%2B-success)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-brightgreen)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Security Scan](https://github.com/Trevictus/TabletopMastering/actions/workflows/security-scan.yml/badge.svg)](https://github.com/Trevictus/TabletopMastering/actions/workflows/security-scan.yml)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](CODE_OF_CONDUCT.md)

## Description

Tabletop Mastering helps board game enthusiasts keep track of their gaming sessions, whether you're part of a local club or just play with friends. Track your games, record results, view statistics, and see how you stack up against other players.

## Features

- Search and add games from BoardGameGeek's extensive catalog
- Create gaming groups and manage members
- Schedule and record game sessions
- Track wins, losses, and personal statistics
- View rankings both globally and within your groups
- GDPR-compliant data management

## Getting Started

The live application is available at **https://tabletopmastering.games/**

Want to run your own instance or contribute to development? Check our [Contributing Guide](CONTRIBUTING.md) for detailed setup instructions.

## Technology Stack

- **Backend:** Node.js + Express + MongoDB + JWT
- **Frontend:** React 19 + Vite 7 + React Router v7 + Zustand
- **State Management:** Zustand (stores for auth, groups, and notifications)
- **API Calls:** Axios with interceptors and error handling
- **DevOps:** Docker + Docker Compose
- **Observability:** Prometheus + Grafana + Loki + Sentry
- **Security:** Helmet.js + CORS + Rate Limiting + bcrypt

## Security

Security is a priority. The application includes:

- JWT authentication with bcrypt password hashing
- HTTP security headers via Helmet.js
- CORS protection
- Rate limiting on authentication endpoints
- Input validation across all endpoints
- Automated security scanning with Trivy
- Dependency vulnerability tracking via Dependabot

Found a security issue? Please check our [Security Policy](SECURITY.md).

## Observability

Running in production? The project includes monitoring tools to help you keep an eye on things:

- **Prometheus** for metrics collection
- **Grafana** for visualization (available at `http://localhost:3001`)
- **Loki** and **Promtail** for log aggregation
- **Sentry** for error tracking

All configured out of the box with Docker Compose.

## Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation, we'd love your help. Check out the [Contributing Guide](CONTRIBUTING.md) to get started.

## Contributors

Built with contributions from:
- [@Aaranaa00](https://github.com/Aaranaa00)
- [@Trevictus](https://github.com/Trevictus)
- [@Juanfu224](https://github.com/Juanfu224)

## License

This project is MIT licensed. See [LICENSE](LICENSE) for details.

## Support

If you find this project useful, give it a star on GitHub!
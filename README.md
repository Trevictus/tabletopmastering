# 🎲 Tabletop Mastering

https://tabletopmastering.games/

> Web platform for comprehensive management of tabletop gaming sessions and groups

[![Node](https://img.shields.io/badge/Node.js-20%2B-success)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-brightgreen)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## Description

Tabletop Mastering is a web application that allows you to organize sessions, record results, manage groups, and consult statistics for tabletop games.  
Designed for clubs, associations, and groups of friends who want to keep track of their games in a simple and collaborative way.

## Justification and Target Audience

The idea for Tabletop Mastering stems from the real need of tabletop gaming groups to have a centralized, modern, and collaborative tool to manage their games, results, and statistics. Many current solutions are complex, paid, or don't adapt to the reality of clubs and associations seeking simplicity, transparency, and control over their data.

**Target audience:**
- Tabletop gaming clubs and associations that organize events and internal leagues.
- Groups of friends who want to keep a historical record of their games and results.
- Players who want to compare their performance and progression over time.

**User benefits:**
- Facilitates organization and communication within the group.
- Allows recording and querying results quickly and visually.
- Offers customized statistics and rankings, motivating participation.
- Guarantees data privacy and control, without depending on commercial external platforms.

This proposal responds to the demand for an accessible, free solution adapted to the English-speaking community, with a focus on user experience and legal compliance.

**Main features:**
- Game catalog with BoardGameGeek integration
- Game session and result registration
- History and personalized statistics
- Global and group-specific rankings
- Administration and configuration panel
- Accessibility and legal compliance (GDPR, privacy regulations, WCAG 2.1)

## Access and Deployment

The application is available in production at:

**https://tabletopmastering.games/**

No installation or configuration is necessary to use the web.

### Do you want to deploy your own instance or contribute?

You can use Docker or the local development environment by following these steps:

#### Docker (optional for custom deployment)
```bash
git clone https://github.com/Trevictus/TabletopMastering.git
cd TabletopMastering
cp .env.example .env
docker compose up -d
```
Access `http://localhost` in your browser.

#### Environment variables (.env)
```env
MONGO_USERNAME=admin
MONGO_PASSWORD=changeme
MONGO_DBNAME=tabletop_mastering
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

#### Local Development
```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Documentation
- [User Guide](docs/user-guide.md)
- [API Documentation](docs/api-en.md)
- [Competitive Analysis](docs/competitive-analysis.md)
- [Organizational Structure](docs/organizational-structure.md)
- [Financing](docs/financing.md)
- [Budget and ROI](docs/budget.md)
- [Resources and APIs](docs/resources.md)
- [Legislation and Compliance](docs/legislation.md)

## Technology Stack

- **Backend:** Node.js + Express + MongoDB + JWT
- **Frontend:** React 19 + Vite 7 + React Router v7 + Zustand
- **State Management:** Zustand (stores for auth, groups, and notifications)
- **API Calls:** Axios with interceptors and error handling
- **DevOps:** Docker + Docker Compose

## Project Status

| Module         | Status   |
|----------------|----------|
| Authentication | 100%     |
| Groups         | 100%     |
| Games          | 100%     |
| Matches        | 100%     |
| Statistics     | 100%     |
| Base Frontend  | 100%     |
| Accessibility  | 100%     |
| Legal          | 100%     |

Project completed and validated in all sprints.  
Documentation, budget, and resource management updated.

## Authors

- [@Aaranaa00](https://github.com/Aaranaa00) — Backend and frontend development
- [@Trevictus](https://github.com/Trevictus) — Design, UX/UI, and frontend
- [@Juanfu224](https://github.com/Juanfu224) — Scrum Master, DevOps, and management

## License

MIT License — See [LICENSE](LICENSE)

---

**⭐ If this has been useful to you, share Tabletop Mastering with your group and leave us your feedback.**

*Educational DAW project — Made with passion and teamwork for the tabletop gaming community.*
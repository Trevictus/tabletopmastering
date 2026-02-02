# Contributing to Tabletop Mastering

Thanks for considering contributing to Tabletop Mastering! This guide will help you get started.

## Code of Conduct

We follow a [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community welcoming and respectful.

## Ways to Contribute

### Reporting Bugs

Found a bug? Please search existing issues first to avoid duplicates. When reporting:

- Write a clear, descriptive title
- List the steps to reproduce the issue
- Describe what happened vs. what you expected
- Add screenshots if helpful
- Include your environment (OS, browser, Node.js version)

### Suggesting Features

Have an idea? Open an issue and describe:

- What problem it solves
- How it would work
- Why it would be useful
- Similar features in other apps (if any)

### Pull Requests

Ready to code? Here's the workflow:

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add tests if you're adding functionality
4. Make sure your code lints (`npm run lint`)
5. Update relevant documentation
6. Write a clear commit message (see below)
7. Submit your PR

## Development Setup

### What You'll Need

- Node.js 20 or higher
- MongoDB 8.0 or higher
- Docker (optional, but recommended)

### Getting Started

**Option 1: Docker (Recommended)**

```bash
git clone https://github.com/Trevictus/TabletopMastering.git
cd TabletopMastering
cp .env.example .env
docker compose up -d
```

Visit `http://localhost` to see it running.

**Option 2: Local Development**

```bash
# Clone the repo
git clone https://github.com/Trevictus/TabletopMastering.git
cd TabletopMastering

# Start the backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev

**Keep it simple:**
- Use ES6+ syntax
- Follow the existing formatting
- Name things clearly
- Comment complex logic
- Keep functions focused and small

**Commit Messages:**

Use conventional commits format:

```
type: brief description

Longer explanation if needed

Closes #123
```

Common types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting changes
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance stuff

Example:
```
feat: add password reset functionality

- Add forgot password endpoint
- Create reset token system
- Send reset emails

Closes #45
```

### Commit Prefixes

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Testing

```bash
# Backend tests
cdSpecific tests
npm run test:db      # Database connection
npm run test:games   # Game functionality
```

## Project Structure

```
TabletopMastering/
├── backend/           # Express API
│   ├── controllers/   # Request handlers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── middlewares/   # Express middleware
│   └── services/      # Business logic
├── frontend/          # React app
│   └── src/
│       ├── components/  # Reusable components
│       ├── pages/       # Page components
│       ├── services/    # API calls
│       └── stores/      # State management
└── observability/     # Monitoring stack
```

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments to new functions
- Document new API endpoints
- Update CHANGELOG.md for notable changes

## Questions?

Not sure about something? Open an issue and ask. We're here to help!

## License

By contributing, you agree your contributions will be MIT licensed
## License

By contributing, you agree that your contributions will be licensed under the MIT License.

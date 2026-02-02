# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported |
| ------- | --------- |
| 1.x.x   | ✓         |
| < 1.0   | ✗         |

## Reporting a Vulnerability

Found a security issue? Please report it responsibly by NOT opening a public issue.

**How to report:**

1. Email the maintainers with details about the vulnerability
2. Include steps to reproduce if possible
3. Expect an initial response within 48 hours

We take security seriously and will work with you to address the issue promptly.

## Security Measures

### Authentication & Authorization

- Passwords hashed with bcrypt (cost factor: 10)
- JWT tokens for session management
- Token validation on every authenticated request

### Data Protection

- All API endpoints require proper authentication
- Input validation and sanitization
- Parameterized database queries to prevent injection

### Infrastructure

- CORS configured for trusted origins only
- Rate limiting on all routes (stricter on auth endpoints)
- Security headers via Helmet.js and Nginx
- File upload restrictions (type and size limits)

### Environment Security

These values must be kept secure in production:

| Variable | Purpose |
| -------- | ------- |
| `JWT_SECRET` | Token signing key (use 32+ random characters) |
| `MONGO_PASSWORD` | Database authentication |
| `SENTRY_DSN` | Error tracking (optional) |
| `GRAFANA_PASSWORD` | Monitoring dashboard access |

Never commit `.env` files to version control.

### Production Checklist

Before going live, verify:

- [ ] `NODE_ENV` set to `production`
- [ ] `JWT_SECRET` is strong (32+ characters)
- [ ] `MONGO_PASSWORD` is unique and secure
- [ ] HTTPS enabled with HTTP redirect
- [ ] Debug logs disabled
- [ ] Rate limits configured for your traffic
- [ ] Database backups configured

## Disclosure Policy

Our process for handling security reports:

1. You submit the issue privately
2. We confirm receipt within 48 hours
3. We investigate and develop a fix
4. We release the fix and disclose the vulnerability
5. We credit you (unless you prefer anonymity)

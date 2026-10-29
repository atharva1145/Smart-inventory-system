# Deployment & Operations Guide

## 1. Production Architecture with Docker Compose

In a production or staging environment, the application runs using `docker-compose.yml`, which orchestrates three isolated services:

```mermaid
graph TD
    Client["Browser / Client"] -->|Port 80 / 443| Nginx["frontend (Nginx Alpine)"]
    Nginx -->|/api/* (Reverse Proxy)| Backend["backend (Spring Boot JRE 21 Alpine)"]
    Nginx -->|Static SPA Assets| Assets["frontend/dist"]
    Backend -->|Port 5432 (Internal Network)| Postgres[("postgres (PostgreSQL 16 Alpine)")]
```

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` before production deployment:

```bash
cp .env.example .env
```

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `PORT` | Backend application port | `8080` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `postgres` |
| `DB_HOST` | PostgreSQL hostname | `postgres` (in Docker) or `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database schema name | `smart_inventory` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Strong PostgreSQL password | *(generate secure 32+ char secret)* |
| `JWT_SECRET` | 256-bit Hex/Base64 secret for JWT signing | *(generate random 64-char secret)* |
| `JWT_EXPIRATION_MS` | Token validity duration | `86400000` (24 hours) |
| `SEED_DATA` | Auto-seed demo categories/users | `false` (in production) |
| `CORS_ALLOWED_ORIGINS` | Permitted origins for API requests | `https://inventory.yourcompany.com` |

---

## 3. Docker Compose Commands

### Start All Services in Background
```bash
docker-compose up -d --build
```

### View Real-Time Container Logs
```bash
docker-compose logs -f backend
```

### Check Container Health Status
```bash
docker-compose ps
```

### Stop All Services
```bash
docker-compose down
```

### Backup Database Volume
```bash
docker-compose exec -T postgres pg_dump -U postgres smart_inventory > backup_$(date +%Y%m%d).sql
```

---

## 4. Continuous Integration (CI/CD)

A complete GitHub Actions pipeline is provided in `.github/workflows/ci.yml`.
On every push and pull request to `main`:
1. Spawns an ephemeral PostgreSQL 16 service container.
2. Sets up Java 21 JDK and executes `mvn clean verify` across all 28 tests.
3. Sets up Node.js 20 and executes `tsc` validation followed by `vite build`.
4. Artifacts are archived upon successful completion.

---

## 5. Production Hardening Checklist

- [ ] **Disable Development Seed Data**: Set `SEED_DATA=false` in production to prevent recreating default accounts.
- [ ] **Rotate JWT Secret**: Replace the default secret with a secure key generated via `openssl rand -hex 32`.
- [ ] **Configure HTTPS / SSL**: Terminate TLS at the Nginx reverse proxy or cloud load balancer (e.g. AWS ALB, Cloudflare, Let's Encrypt).
- [ ] **Database Connection Pool**: HikariCP is pre-configured with a maximum pool size of 20. Scale based on server vCPU and concurrent order volume.
- [ ] **Automated Database Backups**: Schedule nightly cron jobs to dump PostgreSQL volumes to object storage (e.g. AWS S3, Google Cloud Storage).

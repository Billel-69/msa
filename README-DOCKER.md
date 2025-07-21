# MSA Platform - Docker Setup

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/msa.git
   cd msa
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - MySQL: localhost:3306
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│    MySQL    │
│  (React)    │     │  (Node.js)  │     └─────────────┘
│  Port 3000  │     │  Port 5000  │             │
└─────────────┘     └─────────────┘             ▼
                            │              ┌─────────────┐
                            ├─────────────▶│   MongoDB   │
                            │              └─────────────┘
                            │                    │
                            └─────────────▶┌─────────────┐
                                          │    Redis    │
                                          └─────────────┘
```

## Services

- **Frontend**: React application with Nginx
- **Backend**: Node.js Express API
- **MySQL**: Main database for user data and game progress
- **MongoDB**: Document store for posts, comments, and analytics
- **Redis**: Cache and session storage
- **RAG Service** (optional): Python service for AI features

## Commands

### Start all services
```bash
docker compose up -d
```

### View logs
```bash
docker compose logs -f [service-name]
```

### Stop all services
```bash
docker compose down
```

### Reset everything (including volumes)
```bash
docker compose down -v
```

### Start with RAG service
```bash
docker compose --profile rag up -d
```

## Development

### Rebuild after code changes
```bash
docker compose build [service-name]
docker compose up -d [service-name]
```

### Access service shells
```bash
docker compose exec backend sh
docker compose exec mysql mysql -u root -p
```

## Troubleshooting

1. **Port conflicts**: Ensure ports 3000, 5000, 3306, 27017, 6379 are free
2. **Permission issues**: Run `docker compose down -v` and restart
3. **Build failures**: Clear Docker cache with `docker system prune -a`

## Environment Variables

See `.env.example` for all available configuration options. Key variables:
- `JWT_SECRET`: Must be changed for production
- `OPENAI_API_KEY`: Required for AI features
- `AGORA_APP_ID`: Required for live streaming features
# Deployment Setup

## Required GitHub Secrets

To enable automatic deployment to production, configure these secrets in your GitHub repository:

### 1. HOST_IP
- **Description**: IP address of your production server
- **Example**: `203.0.113.1`
- **How to set**: Repository Settings → Secrets and variables → Actions → New repository secret

### 2. SSH_PRIVATE_KEY
- **Description**: Private SSH key for the `deploy` user on your server
- **Format**: Complete RSA private key including headers
- **Example**:
```
-----BEGIN OPENSSH PRIVATE KEY-----
[your private key content]
-----END OPENSSH PRIVATE KEY-----
```
- **Note**: This should be the private key corresponding to the public key in `/home/deploy/.ssh/authorized_keys`

### 3. GITHUB_TOKEN
- **Description**: Automatically provided by GitHub Actions
- **Note**: No manual configuration needed - GitHub provides this automatically

## Server Setup Requirements

### 1. Deploy User Setup
```bash
# Create deploy user
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /home/deploy/.ssh
sudo chown deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh

# Add your public key to authorized_keys
sudo nano /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
```

### 2. Application Directory Setup
```bash
# Create application directory
sudo mkdir -p /opt/msa-app
sudo chown deploy:deploy /opt/msa-app

# Clone repository
sudo -u deploy git clone https://github.com/[YOUR_USERNAME]/msa.git /opt/msa-app
cd /opt/msa-app
```

### 3. Docker Installation
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add deploy user to docker group
sudo usermod -aG docker deploy
```

### 4. Environment Variables
Create `/opt/msa-app/.env.production`:
```bash
NODE_ENV=production
DB_NAME=msa_db
DB_USER=msa_user
DB_PASS=your_secure_password
MYSQL_ROOT_PASSWORD=your_root_password
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
AGORA_APP_ID=your_agora_id
AGORA_APP_CERTIFICATE=your_agora_cert
```

## Deployment Process

1. **Trigger**: Push to `develop` branch
2. **Build**: GitHub Actions builds Docker images for backend, frontend, and RAG service
3. **Push**: Images are pushed to GitHub Container Registry (GHCR)
4. **Deploy**: SSH into server, pull latest images, and restart containers
5. **Verify**: Health checks ensure services are running correctly

## Manual Deployment

To deploy manually:
```bash
# On the server
cd /opt/msa-app
git pull origin develop
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Health Checks

After deployment, verify:
- Services are running: `docker compose ps`
- API health: `curl http://localhost:5000/health`
- Frontend: `curl http://localhost:3000`

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify HOST_IP is correct
   - Check SSH_PRIVATE_KEY format
   - Ensure deploy user exists on server

2. **Docker Login Failed**
   - Check GitHub token permissions
   - Verify GHCR access

3. **Container Start Failed**
   - Check environment variables
   - Review Docker logs: `docker compose logs`

### Logs
```bash
# View deployment logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose logs backend
docker compose logs frontend
```
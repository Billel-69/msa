#!/bin/bash

# =================================================================
# Script d'Installation du Serveur MSA
# =================================================================
# Ce script configure un serveur Ubuntu 22.04 pour héberger MSA
# À exécuter en tant que root sur un serveur VIERGE
# =================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Vérifier que le script est exécuté en tant que root
if [[ $EUID -ne 0 ]]; then
   log_error "Ce script doit être exécuté en tant que root"
   exit 1
fi

log_info "Début de l'installation du serveur MSA..."

# =================================================================
# 1. MISE À JOUR DU SYSTÈME
# =================================================================
log_info "Mise à jour du système..."
apt update && apt upgrade -y
apt install -y curl wget git build-essential software-properties-common

# =================================================================
# 2. INSTALLATION DE NODE.JS (v18 LTS)
# =================================================================
log_info "Installation de Node.js v18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Vérifier l'installation
node_version=$(node -v)
npm_version=$(npm -v)
log_info "Node.js installé: $node_version"
log_info "NPM installé: $npm_version"

# =================================================================
# 3. INSTALLATION DE MYSQL
# =================================================================
log_info "Installation de MySQL..."
apt install -y mysql-server

# Démarrer et activer MySQL
systemctl start mysql
systemctl enable mysql

# Sécuriser MySQL
log_info "Configuration de MySQL..."
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'TempPassword123!';"

# Créer la base de données et l'utilisateur
log_warning "Création de la base de données MSA..."
mysql -u root -pTempPassword123! <<EOF
CREATE DATABASE IF NOT EXISTS msa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'msa_user'@'localhost' IDENTIFIED BY 'MsaPassword123!';
GRANT ALL PRIVILEGES ON msa_db.* TO 'msa_user'@'localhost';
FLUSH PRIVILEGES;
EOF

log_warning "⚠️  IMPORTANT: Notez ces informations de base de données:"
log_warning "Base de données: msa_db"
log_warning "Utilisateur: msa_user"
log_warning "Mot de passe: MsaPassword123!"
log_warning "⚠️  CHANGEZ CE MOT DE PASSE APRÈS L'INSTALLATION!"

# =================================================================
# 4. INSTALLATION DE NGINX
# =================================================================
log_info "Installation de Nginx..."
apt install -y nginx

# =================================================================
# 5. INSTALLATION DE PM2
# =================================================================
log_info "Installation de PM2..."
npm install -g pm2

# Configuration PM2 pour démarrer au boot
pm2 startup systemd -u root --hp /root
pm2 save

# =================================================================
# 6. INSTALLATION DE CERTBOT (Let's Encrypt)
# =================================================================
log_info "Installation de Certbot pour SSL..."
apt install -y certbot python3-certbot-nginx

# =================================================================
# 7. CONFIGURATION DU PARE-FEU
# =================================================================
log_info "Configuration du pare-feu UFW..."
apt install -y ufw

# Configurer les règles
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3306/tcp  # MySQL (seulement localhost par défaut)

# Activer le pare-feu
echo "y" | ufw enable

# =================================================================
# 8. CRÉATION DE LA STRUCTURE DES DOSSIERS
# =================================================================
log_info "Création de la structure des dossiers..."

mkdir -p /var/www/msa-app/{backend,frontend,uploads,scripts,backups,logs}
mkdir -p /var/www/msa-app/uploads/{avatars,posts,messages}

# Définir les permissions
chown -R www-data:www-data /var/www/msa-app
chmod -R 755 /var/www/msa-app
chmod -R 775 /var/www/msa-app/uploads
chmod -R 775 /var/www/msa-app/backups
chmod -R 775 /var/www/msa-app/logs

# =================================================================
# 9. INSTALLATION D'OUTILS SUPPLÉMENTAIRES
# =================================================================
log_info "Installation d'outils supplémentaires..."
apt install -y htop ncdu unzip zip fail2ban

# Configuration basique de fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban

# =================================================================
# 10. CONFIGURATION DE SWAP (si nécessaire)
# =================================================================
log_info "Vérification de la mémoire swap..."
if [ $(swapon -s | wc -l) -eq 1 ]; then
    log_info "Création d'un fichier swap de 4GB..."
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# =================================================================
# 11. OPTIMISATIONS SYSTÈME
# =================================================================
log_info "Application des optimisations système..."

# Augmenter les limites de fichiers
cat >> /etc/security/limits.conf <<EOF
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535
EOF

# Optimisations réseau
cat >> /etc/sysctl.conf <<EOF
# Optimisations réseau pour Node.js
net.core.somaxconn = 1024
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10000 65535
EOF

sysctl -p

# =================================================================
# 12. CRÉATION DES SCRIPTS DE BASE
# =================================================================
log_info "Création des scripts de maintenance..."

# Script de vérification
cat > /var/www/msa-app/scripts/check-health.sh <<'EOF'
#!/bin/bash
echo "=== Santé du Système MSA ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "RAM: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disque: $(df -h / | tail -1 | awk '{print $5}')"
echo "Nginx: $(systemctl is-active nginx)"
echo "MySQL: $(systemctl is-active mysql)"
echo "PM2: $(pm2 list)"
EOF

chmod +x /var/www/msa-app/scripts/check-health.sh

# =================================================================
# 13. CONFIGURATION CRON POUR SAUVEGARDES
# =================================================================
log_info "Configuration des tâches cron..."

# Ajouter la tâche de sauvegarde quotidienne
(crontab -l 2>/dev/null; echo "0 3 * * * /var/www/msa-app/scripts/backup.sh >> /var/www/msa-app/logs/backup.log 2>&1") | crontab -

# =================================================================
# FINALISATION
# =================================================================
log_info "Installation terminée!"
echo ""
echo "================================================================="
echo "                    INSTALLATION TERMINÉE!"
echo "================================================================="
echo ""
echo "Prochaines étapes:"
echo "1. Téléchargez le code de l'application dans /var/www/msa-app/"
echo "2. Configurez les fichiers .env"
echo "3. Exécutez le script de déploiement: ./deploy.sh"
echo "4. Configurez votre domaine et SSL avec: certbot --nginx"
echo ""
echo "Informations importantes:"
echo "- MySQL User: msa_user"
echo "- MySQL Pass: MsaPassword123! (À CHANGER!)"
echo "- MySQL DB: msa_db"
echo "- App Path: /var/www/msa-app/"
echo ""
echo "================================================================="
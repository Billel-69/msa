#!/bin/bash

# =================================================================
# Script de Déploiement MSA
# =================================================================
# Ce script déploie ou met à jour l'application MSA
# À exécuter depuis le serveur de production
# =================================================================

set -e  # Arrêter en cas d'erreur

# Configuration
APP_DIR="/var/www/msa-app"
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_info() {
    log "${GREEN}[INFO]${NC} $1"
}

log_error() {
    log "${RED}[ERREUR]${NC} $1"
}

log_warning() {
    log "${YELLOW}[ATTENTION]${NC} $1"
}

log_step() {
    log "${BLUE}[ÉTAPE]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$APP_DIR" ]; then
    log_error "Le répertoire $APP_DIR n'existe pas!"
    exit 1
fi

cd "$APP_DIR"

# =================================================================
# 1. SAUVEGARDE AVANT DÉPLOIEMENT
# =================================================================
log_step "Création d'une sauvegarde de sécurité..."

BACKUP_NAME="pre-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Sauvegarder les fichiers importants
if [ -d "backend" ]; then
    cp -r backend "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
fi
if [ -d "frontend/build" ]; then
    cp -r frontend/build "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
fi

log_info "Sauvegarde créée: $BACKUP_NAME"

# =================================================================
# 2. MISE À JOUR DU CODE
# =================================================================
log_step "Mise à jour du code depuis Git..."

# Si c'est un nouveau déploiement
if [ ! -d ".git" ]; then
    log_warning "Pas de repository Git trouvé. Clonage initial..."
    # Sauvegarder les configs existantes
    if [ -f "backend/.env" ]; then
        cp backend/.env /tmp/backend.env.backup
    fi
    if [ -f "frontend/.env" ]; then
        cp frontend/.env /tmp/frontend.env.backup
    fi
    
    # Cloner le repository
    git clone https://github.com/votre-username/msa.git temp_msa
    cp -r temp_msa/* .
    cp -r temp_msa/.* . 2>/dev/null || true
    rm -rf temp_msa
    
    # Restaurer les configs
    if [ -f "/tmp/backend.env.backup" ]; then
        cp /tmp/backend.env.backup backend/.env
    fi
    if [ -f "/tmp/frontend.env.backup" ]; then
        cp /tmp/frontend.env.backup frontend/.env
    fi
else
    # Mise à jour du code existant
    git fetch origin
    git pull origin main
fi

# =================================================================
# 3. INSTALLATION DES DÉPENDANCES BACKEND
# =================================================================
log_step "Installation des dépendances backend..."

cd "$APP_DIR/backend"

# Nettoyer le cache npm si nécessaire
npm cache clean --force

# Installer les dépendances
npm ci --production

# =================================================================
# 4. BUILD DU FRONTEND
# =================================================================
log_step "Build du frontend React..."

cd "$APP_DIR/frontend"

# Installer les dépendances
npm ci

# Variables d'environnement pour le build
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

# Build
npm run build

# Vérifier que le build a réussi
if [ ! -d "build" ]; then
    log_error "Le build du frontend a échoué!"
    exit 1
fi

log_info "Build frontend terminé avec succès"

# =================================================================
# 5. MIGRATION DE LA BASE DE DONNÉES
# =================================================================
log_step "Vérification des migrations de base de données..."

cd "$APP_DIR/backend"

# Vérifier si des scripts de migration existent
if [ -d "scripts" ] && ls scripts/*.sql 1> /dev/null 2>&1; then
    log_info "Exécution des migrations SQL..."
    for script in scripts/*.sql; do
        if [ -f "$script" ]; then
            log_info "Exécution de: $script"
            mysql -u msa_user -p msa_db < "$script" 2>/dev/null || log_warning "Migration déjà appliquée: $script"
        fi
    done
fi

# =================================================================
# 6. MISE À JOUR DES PERMISSIONS
# =================================================================
log_step "Mise à jour des permissions..."

chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod -R 775 "$APP_DIR/uploads"
chmod -R 775 "$APP_DIR/backups"
chmod -R 775 "$APP_DIR/logs"

# =================================================================
# 7. REDÉMARRAGE DES SERVICES
# =================================================================
log_step "Redémarrage des services..."

# PM2
cd "$APP_DIR"
if pm2 list | grep -q "msa-backend"; then
    log_info "Redémarrage de l'application avec PM2..."
    pm2 reload ecosystem.config.js --update-env
else
    log_info "Démarrage initial de l'application avec PM2..."
    pm2 start ecosystem.config.js
    pm2 save
fi

# Nginx
log_info "Rechargement de Nginx..."
nginx -t && systemctl reload nginx

# =================================================================
# 8. VÉRIFICATIONS POST-DÉPLOIEMENT
# =================================================================
log_step "Vérifications post-déploiement..."

# Attendre que l'application démarre
sleep 5

# Vérifier que le backend répond
if curl -f -s http://localhost:5000/health > /dev/null; then
    log_info "✓ Backend opérationnel"
else
    log_error "✗ Le backend ne répond pas!"
fi

# Vérifier que PM2 fonctionne
pm2_status=$(pm2 list | grep msa-backend | awk '{print $18}')
if [ "$pm2_status" = "online" ]; then
    log_info "✓ PM2 status: online"
else
    log_error "✗ PM2 status: $pm2_status"
fi

# =================================================================
# 9. NETTOYAGE
# =================================================================
log_step "Nettoyage..."

# Supprimer les vieilles sauvegardes (garder les 10 dernières)
cd "$BACKUP_DIR"
ls -t | tail -n +11 | xargs -r rm -rf

# Nettoyer les logs de plus de 30 jours
find "$APP_DIR/logs" -name "*.log" -mtime +30 -delete

# =================================================================
# RÉSUMÉ
# =================================================================
echo ""
log "${GREEN}=================================================================${NC}"
log "${GREEN}                 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!${NC}"
log "${GREEN}=================================================================${NC}"
echo ""
log_info "Version déployée: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
log_info "Heure: $(date)"
log_info "Log complet: $LOG_FILE"
echo ""
log_warning "Vérifications recommandées:"
log_warning "1. Testez le site: https://votre-domaine.com"
log_warning "2. Vérifiez les logs: pm2 logs"
log_warning "3. Monitorer: pm2 monit"
echo ""
log "${GREEN}=================================================================${NC}"
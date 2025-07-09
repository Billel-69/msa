#!/bin/bash

# =================================================================
# Script de Sauvegarde MSA
# =================================================================
# Sauvegarde automatique de la base de données et des fichiers
# À exécuter quotidiennement via cron
# =================================================================

# Configuration
APP_DIR="/var/www/msa-app"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="backup-$DATE"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
LOG_FILE="$APP_DIR/logs/backup.log"

# Retention des sauvegardes (en jours)
RETENTION_DAYS=7

# Informations MySQL
DB_NAME="msa_db"
DB_USER="msa_user"
DB_PASS="MsaPassword123!"  # À remplacer par votre mot de passe

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Vérifier l'espace disque
check_disk_space() {
    local available=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    local required=1048576  # 1GB en KB
    
    if [ "$available" -lt "$required" ]; then
        log_error "Espace disque insuffisant! Disponible: ${available}KB, Requis: ${required}KB"
        return 1
    fi
    return 0
}

# =================================================================
# DÉBUT DE LA SAUVEGARDE
# =================================================================
log "=== Début de la sauvegarde MSA ==="

# Vérifier l'espace disque
if ! check_disk_space; then
    log_error "Sauvegarde annulée: espace disque insuffisant"
    exit 1
fi

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_PATH"
if [ $? -ne 0 ]; then
    log_error "Impossible de créer le répertoire de sauvegarde"
    exit 1
fi

# =================================================================
# 1. SAUVEGARDE DE LA BASE DE DONNÉES
# =================================================================
log "Sauvegarde de la base de données MySQL..."

# Dump de la base de données
mysqldump -u "$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-database \
    --databases "$DB_NAME" \
    > "$BACKUP_PATH/database.sql" 2>/dev/null

if [ $? -eq 0 ]; then
    log_success "Base de données sauvegardée"
    # Compresser le dump
    gzip "$BACKUP_PATH/database.sql"
else
    log_error "Échec de la sauvegarde de la base de données"
fi

# =================================================================
# 2. SAUVEGARDE DES FICHIERS UPLOADS
# =================================================================
log "Sauvegarde des fichiers uploads..."

if [ -d "$APP_DIR/uploads" ]; then
    tar -czf "$BACKUP_PATH/uploads.tar.gz" -C "$APP_DIR" uploads 2>/dev/null
    if [ $? -eq 0 ]; then
        log_success "Fichiers uploads sauvegardés"
    else
        log_error "Échec de la sauvegarde des uploads"
    fi
else
    log_warning "Dossier uploads introuvable"
fi

# =================================================================
# 3. SAUVEGARDE DES CONFIGURATIONS
# =================================================================
log "Sauvegarde des configurations..."

# Créer un dossier pour les configs
mkdir -p "$BACKUP_PATH/configs"

# Sauvegarder les fichiers .env
if [ -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env" "$BACKUP_PATH/configs/backend.env"
fi

if [ -f "$APP_DIR/frontend/.env" ]; then
    cp "$APP_DIR/frontend/.env" "$BACKUP_PATH/configs/frontend.env"
fi

# Sauvegarder ecosystem.config.js
if [ -f "$APP_DIR/ecosystem.config.js" ]; then
    cp "$APP_DIR/ecosystem.config.js" "$BACKUP_PATH/configs/"
fi

# Sauvegarder la config nginx
if [ -f "/etc/nginx/sites-available/msa" ]; then
    cp "/etc/nginx/sites-available/msa" "$BACKUP_PATH/configs/nginx.conf"
fi

log_success "Configurations sauvegardées"

# =================================================================
# 4. INFORMATIONS DE SAUVEGARDE
# =================================================================
log "Création du fichier d'information..."

cat > "$BACKUP_PATH/backup-info.txt" <<EOF
Sauvegarde MSA
==============
Date: $(date)
Serveur: $(hostname)
IP: $(hostname -I | awk '{print $1}')

Contenu:
- database.sql.gz : Dump complet de la base de données
- uploads.tar.gz : Fichiers uploadés par les utilisateurs
- configs/ : Fichiers de configuration

Version Git: $(cd "$APP_DIR" && git rev-parse --short HEAD 2>/dev/null || echo "N/A")

Pour restaurer:
1. Extraire database.sql.gz et importer dans MySQL
2. Extraire uploads.tar.gz dans /var/www/msa-app/
3. Vérifier les configs dans configs/
EOF

# =================================================================
# 5. COMPRESSION FINALE
# =================================================================
log "Compression de la sauvegarde complète..."

cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"

if [ $? -eq 0 ]; then
    # Supprimer le dossier non compressé
    rm -rf "$BACKUP_NAME"
    log_success "Sauvegarde compressée: $BACKUP_NAME.tar.gz"
    
    # Calculer la taille
    SIZE=$(du -h "$BACKUP_NAME.tar.gz" | cut -f1)
    log "Taille de la sauvegarde: $SIZE"
else
    log_error "Échec de la compression"
fi

# =================================================================
# 6. NETTOYAGE DES ANCIENNES SAUVEGARDES
# =================================================================
log "Nettoyage des sauvegardes de plus de $RETENTION_DAYS jours..."

find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete
DELETED=$?

if [ $DELETED -eq 0 ]; then
    log_success "Anciennes sauvegardes supprimées"
fi

# =================================================================
# 7. VÉRIFICATION FINALE
# =================================================================
log "Vérification de l'intégrité..."

if [ -f "$BACKUP_DIR/$BACKUP_NAME.tar.gz" ]; then
    tar -tzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "Sauvegarde vérifiée avec succès"
    else
        log_error "La sauvegarde semble corrompue!"
    fi
fi

# =================================================================
# RÉSUMÉ
# =================================================================
log "=== Sauvegarde terminée ==="
log "Fichier: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
log "Espace disque restant: $(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')"

# Envoyer un email si configuré (optionnel)
# echo "Sauvegarde MSA terminée: $BACKUP_NAME.tar.gz" | mail -s "MSA Backup Success" admin@example.com

exit 0
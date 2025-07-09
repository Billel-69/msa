#!/bin/bash

# =================================================================
# Script de Consultation des Logs MSA
# =================================================================
# Affiche les logs récents de l'application de manière claire
# =================================================================

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOG_DIR="/var/www/msa-app/logs"

echo "========================================="
echo -e "${BLUE}   LOGS DE L'APPLICATION MSA${NC}"
echo "========================================="
echo ""

# Fonction pour afficher un séparateur
separator() {
    echo -e "${YELLOW}--- $1 ---${NC}"
}

# 1. Logs PM2 (Application Node.js)
separator "LOGS APPLICATION (PM2)"
if [ -f "$LOG_DIR/pm2-out.log" ]; then
    echo "Dernières activités:"
    tail -n 20 "$LOG_DIR/pm2-out.log"
else
    echo -e "${RED}Fichier de log PM2 introuvable${NC}"
fi

echo ""

# 2. Erreurs PM2
separator "ERREURS APPLICATION (PM2)"
if [ -f "$LOG_DIR/pm2-error.log" ]; then
    error_count=$(wc -l < "$LOG_DIR/pm2-error.log")
    if [ $error_count -gt 0 ]; then
        echo "Dernières erreurs ($error_count au total):"
        tail -n 10 "$LOG_DIR/pm2-error.log"
    else
        echo -e "${GREEN}Aucune erreur enregistrée${NC}"
    fi
else
    echo -e "${YELLOW}Fichier d'erreur PM2 introuvable${NC}"
fi

echo ""

# 3. Logs Nginx (Accès)
separator "LOGS NGINX (ACCÈS)"
if [ -f "$LOG_DIR/nginx-access.log" ]; then
    echo "Dernières requêtes:"
    tail -n 10 "$LOG_DIR/nginx-access.log" | while read line; do
        # Colorer les codes de réponse
        if echo "$line" | grep -q " 200 "; then
            echo -e "${GREEN}$line${NC}"
        elif echo "$line" | grep -q " 4[0-9][0-9] "; then
            echo -e "${YELLOW}$line${NC}"
        elif echo "$line" | grep -q " 5[0-9][0-9] "; then
            echo -e "${RED}$line${NC}"
        else
            echo "$line"
        fi
    done
else
    echo -e "${RED}Fichier de log Nginx (accès) introuvable${NC}"
fi

echo ""

# 4. Erreurs Nginx
separator "ERREURS NGINX"
if [ -f "$LOG_DIR/nginx-error.log" ]; then
    error_count=$(wc -l < "$LOG_DIR/nginx-error.log")
    if [ $error_count -gt 0 ]; then
        echo "Dernières erreurs ($error_count au total):"
        tail -n 10 "$LOG_DIR/nginx-error.log"
    else
        echo -e "${GREEN}Aucune erreur Nginx enregistrée${NC}"
    fi
else
    echo -e "${YELLOW}Fichier d'erreur Nginx introuvable${NC}"
fi

echo ""

# 5. Logs de déploiement
separator "LOGS DE DÉPLOIEMENT"
deploy_logs=$(ls -t "$LOG_DIR"/deploy-*.log 2>/dev/null | head -1)
if [ -n "$deploy_logs" ]; then
    echo "Dernier déploiement:"
    tail -n 15 "$deploy_logs"
else
    echo -e "${YELLOW}Aucun log de déploiement trouvé${NC}"
fi

echo ""

# 6. Logs de sauvegarde
separator "LOGS DE SAUVEGARDE"
if [ -f "$LOG_DIR/backup.log" ]; then
    echo "Dernières sauvegardes:"
    tail -n 10 "$LOG_DIR/backup.log"
else
    echo -e "${YELLOW}Aucun log de sauvegarde trouvé${NC}"
fi

echo ""

# 7. Résumé des erreurs
separator "RÉSUMÉ DES ERREURS"

# Compter les erreurs récentes (dernières 24h)
total_errors=0

# Erreurs PM2 récentes
if [ -f "$LOG_DIR/pm2-error.log" ]; then
    pm2_errors=$(find "$LOG_DIR/pm2-error.log" -mtime -1 -exec wc -l {} \; 2>/dev/null | awk '{print $1}' || echo 0)
    total_errors=$((total_errors + pm2_errors))
    echo "Erreurs PM2 (24h): $pm2_errors"
fi

# Erreurs Nginx récentes
if [ -f "$LOG_DIR/nginx-error.log" ]; then
    nginx_errors=$(find "$LOG_DIR/nginx-error.log" -mtime -1 -exec wc -l {} \; 2>/dev/null | awk '{print $1}' || echo 0)
    total_errors=$((total_errors + nginx_errors))
    echo "Erreurs Nginx (24h): $nginx_errors"
fi

echo ""
if [ $total_errors -eq 0 ]; then
    echo -e "${GREEN}✓ Aucune erreur dans les dernières 24h${NC}"
else
    echo -e "${RED}⚠ $total_errors erreur(s) dans les dernières 24h${NC}"
fi

echo ""
echo "========================================="
echo "Commandes utiles:"
echo "- Voir les logs en temps réel: pm2 logs"
echo "- Voir les logs détaillés PM2: pm2 logs --lines 50"
echo "- Vider les logs PM2: pm2 flush"
echo "- Voir les logs système: journalctl -f -u nginx"
echo "========================================="
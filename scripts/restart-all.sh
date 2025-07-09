#!/bin/bash

# =================================================================
# Script de Redémarrage Complet MSA
# =================================================================
# Redémarre tous les services de l'application
# À utiliser en cas de problème
# =================================================================

echo "========================================="
echo "   REDÉMARRAGE COMPLET DE MSA"
echo "========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction d'affichage
show_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

# 1. Arrêter PM2
echo "1. Arrêt de l'application Node.js..."
pm2 stop all
show_status "PM2 arrêté"

# 2. Redémarrer MySQL
echo ""
echo "2. Redémarrage de MySQL..."
systemctl restart mysql
show_status "MySQL redémarré"

# 3. Redémarrer Nginx
echo ""
echo "3. Redémarrage de Nginx..."
nginx -t && systemctl restart nginx
show_status "Nginx redémarré"

# 4. Nettoyer les logs PM2
echo ""
echo "4. Nettoyage des logs PM2..."
pm2 flush
show_status "Logs PM2 nettoyés"

# 5. Redémarrer l'application
echo ""
echo "5. Démarrage de l'application..."
cd /var/www/msa-app
pm2 start ecosystem.config.js
show_status "Application démarrée"

# 6. Sauvegarder la configuration PM2
echo ""
echo "6. Sauvegarde de la configuration PM2..."
pm2 save
show_status "Configuration sauvegardée"

# Attendre que tout démarre
echo ""
echo "Attente du démarrage complet..."
sleep 5

# 7. Vérifier le statut
echo ""
echo "========================================="
echo "   VÉRIFICATION DU STATUT"
echo "========================================="
echo ""

# PM2
echo "Status PM2:"
pm2 list

echo ""
# Services système
echo "Services système:"
echo -n "MySQL: "
systemctl is-active mysql
echo -n "Nginx: "
systemctl is-active nginx

echo ""
echo "========================================="
echo -e "${GREEN}Redémarrage terminé!${NC}"
echo "Vérifiez votre site: https://votre-domaine.com"
echo "========================================="
#!/bin/bash

# =================================================================
# Script de Vérification du Statut MSA
# =================================================================
# Vérifie l'état de tous les services et de l'application
# =================================================================

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo -e "${BLUE}   STATUT DE L'APPLICATION MSA${NC}"
echo "========================================="
echo ""

# 1. Informations système
echo -e "${BLUE}1. SYSTÈME${NC}"
echo "Date: $(date)"
echo "Serveur: $(hostname)"
echo "Uptime: $(uptime | cut -d',' -f1)"
echo ""

# 2. Utilisation des ressources
echo -e "${BLUE}2. RESSOURCES${NC}"
echo -n "CPU: "
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

echo -n "RAM: "
free -h | grep Mem | awk '{printf "%s/%s (%.1f%%)\n", $3, $2, $3/$2*100}'

echo -n "Disque: "
df -h / | tail -1 | awk '{printf "%s/%s (%s)\n", $3, $2, $5}'

echo ""

# 3. Services système
echo -e "${BLUE}3. SERVICES SYSTÈME${NC}"

# MySQL
mysql_status=$(systemctl is-active mysql)
if [ "$mysql_status" = "active" ]; then
    echo -e "MySQL: ${GREEN}✓ Actif${NC}"
else
    echo -e "MySQL: ${RED}✗ Inactif${NC}"
fi

# Nginx
nginx_status=$(systemctl is-active nginx)
if [ "$nginx_status" = "active" ]; then
    echo -e "Nginx: ${GREEN}✓ Actif${NC}"
else
    echo -e "Nginx: ${RED}✗ Inactif${NC}"
fi

echo ""

# 4. Application PM2
echo -e "${BLUE}4. APPLICATION NODE.JS${NC}"
pm2 list

echo ""

# 5. Connectivité réseau
echo -e "${BLUE}5. CONNECTIVITÉ${NC}"

# Tester le backend
backend_test=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health 2>/dev/null || echo "000")
if [ "$backend_test" = "200" ]; then
    echo -e "Backend (port 5000): ${GREEN}✓ Accessible${NC}"
else
    echo -e "Backend (port 5000): ${RED}✗ Code: $backend_test${NC}"
fi

# Tester Nginx
nginx_test=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")
if [ "$nginx_test" = "200" ]; then
    echo -e "Nginx (port 80): ${GREEN}✓ Accessible${NC}"
else
    echo -e "Nginx (port 80): ${RED}✗ Code: $nginx_test${NC}"
fi

echo ""

# 6. Base de données
echo -e "${BLUE}6. BASE DE DONNÉES${NC}"
mysql_ping=$(mysqladmin -u msa_user -pMsaPassword123! ping 2>/dev/null || echo "failed")
if [ "$mysql_ping" = "mysqld is alive" ]; then
    echo -e "Connexion MySQL: ${GREEN}✓ OK${NC}"
    
    # Compter les utilisateurs
    user_count=$(mysql -u msa_user -pMsaPassword123! -D msa_db -se "SELECT COUNT(*) FROM users" 2>/dev/null || echo "0")
    echo "Nombre d'utilisateurs: $user_count"
    
    # Compter les posts
    post_count=$(mysql -u msa_user -pMsaPassword123! -D msa_db -se "SELECT COUNT(*) FROM posts" 2>/dev/null || echo "0")
    echo "Nombre de posts: $post_count"
else
    echo -e "Connexion MySQL: ${RED}✗ Échec${NC}"
fi

echo ""

# 7. Logs récents
echo -e "${BLUE}7. ERREURS RÉCENTES${NC}"

# Logs PM2
echo "Dernières erreurs PM2:"
if [ -f "/var/www/msa-app/logs/pm2-error.log" ]; then
    tail -n 3 /var/www/msa-app/logs/pm2-error.log 2>/dev/null || echo "Aucune erreur récente"
else
    echo "Fichier de log introuvable"
fi

echo ""

# Logs Nginx
echo "Dernières erreurs Nginx:"
if [ -f "/var/www/msa-app/logs/nginx-error.log" ]; then
    tail -n 3 /var/www/msa-app/logs/nginx-error.log 2>/dev/null || echo "Aucune erreur récente"
else
    echo "Fichier de log introuvable"
fi

echo ""

# 8. Résumé
echo "========================================="
total_issues=0

if [ "$mysql_status" != "active" ]; then ((total_issues++)); fi
if [ "$nginx_status" != "active" ]; then ((total_issues++)); fi
if [ "$backend_test" != "200" ]; then ((total_issues++)); fi

if [ $total_issues -eq 0 ]; then
    echo -e "${GREEN}✓ TOUT FONCTIONNE CORRECTEMENT${NC}"
else
    echo -e "${RED}⚠ $total_issues PROBLÈME(S) DÉTECTÉ(S)${NC}"
    echo ""
    echo "Actions recommandées:"
    if [ "$mysql_status" != "active" ]; then
        echo "- Redémarrer MySQL: systemctl restart mysql"
    fi
    if [ "$nginx_status" != "active" ]; then
        echo "- Redémarrer Nginx: systemctl restart nginx"
    fi
    if [ "$backend_test" != "200" ]; then
        echo "- Redémarrer l'application: pm2 restart all"
    fi
fi

echo "========================================="
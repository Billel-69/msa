#!/bin/bash

# =================================================================
# Script de Sauvegarde Manuelle MSA
# =================================================================
# Déclenche une sauvegarde immédiate
# =================================================================

echo "========================================="
echo "   SAUVEGARDE MANUELLE MSA"
echo "========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Vérifier que le script de sauvegarde existe
BACKUP_SCRIPT="/var/www/msa-app/scripts/backup.sh"

if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo -e "${RED}Erreur: Script de sauvegarde introuvable!${NC}"
    echo "Chemin attendu: $BACKUP_SCRIPT"
    exit 1
fi

# Vérifier les permissions
if [ ! -x "$BACKUP_SCRIPT" ]; then
    echo -e "${YELLOW}Correction des permissions du script de sauvegarde...${NC}"
    chmod +x "$BACKUP_SCRIPT"
fi

echo -e "${YELLOW}Démarrage de la sauvegarde manuelle...${NC}"
echo ""

# Exécuter le script de sauvegarde
"$BACKUP_SCRIPT"

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Sauvegarde manuelle terminée avec succès!${NC}"
    echo ""
    echo "Localisation des sauvegardes:"
    ls -la /var/www/msa-app/backups/backup-*.tar.gz | tail -5
else
    echo ""
    echo -e "${RED}✗ La sauvegarde a échoué!${NC}"
    echo "Consultez les logs pour plus d'informations:"
    echo "tail -f /var/www/msa-app/logs/backup.log"
fi

echo ""
echo "========================================="
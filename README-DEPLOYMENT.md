# Guide de Déploiement MSA - Plateforme Éducative

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation Initiale du Serveur](#installation-initiale-du-serveur)
4. [Configuration de l'Application](#configuration-de-lapplication)
5. [Déploiement](#déploiement)
6. [Maintenance Quotidienne](#maintenance-quotidienne)
7. [Résolution de Problèmes](#résolution-de-problèmes)
8. [Procédures d'Urgence](#procédures-durgence)

## 🎯 Vue d'ensemble

MSA est une plateforme éducative sociale comprenant :
- Un frontend React
- Un backend Node.js/Express
- Une base de données MySQL
- Un système de chat avec IA (Sens AI)
- Des mini-jeux éducatifs
- Un système de streaming vidéo en direct

### Architecture de Production
```
Serveur Scaleway VPS (DEV1-L)
├── Nginx (Port 80/443) → Reverse Proxy
├── PM2 → Gestionnaire de processus Node.js
├── MySQL → Base de données
└── Fichiers statiques → React build
```

## 🔧 Prérequis

### Serveur Requis
- **VPS Scaleway DEV1-L** : 4 vCPU, 8GB RAM, 80GB SSD
- **OS** : Ubuntu 22.04 LTS
- **Domaine** : Votre domaine pointant vers l'IP du serveur

### Accès Requis
- Accès SSH au serveur
- Identifiants MySQL
- Clés API (OpenAI pour Sens AI)

## 🚀 Installation Initiale du Serveur

### Étape 1 : Connexion au Serveur
```bash
# Sur votre ordinateur local
ssh root@VOTRE_IP_SERVEUR
```

### Étape 2 : Exécution du Script d'Installation
```bash
# Télécharger et exécuter le script d'installation
wget https://raw.githubusercontent.com/votre-repo/msa/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

Ce script va automatiquement :
- ✅ Mettre à jour le système
- ✅ Installer Node.js, Nginx, MySQL
- ✅ Configurer le pare-feu
- ✅ Installer PM2
- ✅ Créer les dossiers nécessaires
- ✅ Configurer les permissions

### Étape 3 : Configuration MySQL
```bash
# Le script vous demandera de créer un mot de passe MySQL
# NOTEZ CE MOT DE PASSE ! Vous en aurez besoin plus tard
```

## ⚙️ Configuration de l'Application

### Étape 1 : Variables d'Environnement

#### Backend (.env)
Créez le fichier `/var/www/msa-app/backend/.env` :
```env
# Base de données
DB_HOST=localhost
DB_USER=msa_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_MYSQL
DB_NAME=msa_db

# JWT et Sécurité
JWT_SECRET=GENEREZ_UNE_CLE_SECRETE_ICI
JWT_EXPIRES_IN=7d

# API Keys
OPENAI_API_KEY=votre_cle_openai
ASSISTANT_ID=votre_assistant_id

# Serveur
PORT=5000
NODE_ENV=production

# Upload
UPLOAD_PATH=/var/www/msa-app/uploads
MAX_FILE_SIZE=50mb
```

#### Frontend (.env)
Créez le fichier `/var/www/msa-app/frontend/.env` :
```env
REACT_APP_API_URL=https://votre-domaine.com/api
REACT_APP_SOCKET_URL=https://votre-domaine.com
REACT_APP_ENV=production
```

### Étape 2 : Configuration Nginx
Le fichier nginx est déjà configuré par le script d'installation.
Pour le modifier : `/etc/nginx/sites-available/msa`

### Étape 3 : Configuration PM2
Le fichier ecosystem.config.js est dans `/var/www/msa-app/`

## 📦 Déploiement

### Premier Déploiement
```bash
# Sur votre serveur
cd /var/www/msa-app
./deploy.sh
```

### Mises à Jour
Depuis votre ordinateur local :
```bash
# Dans le dossier du projet
./scripts/deploy-local.sh
```

## 🔧 Maintenance Quotidienne

### Vérifier l'État du Système
```bash
# Vérifier si tout fonctionne
/var/www/msa-app/scripts/check-status.sh
```

### Consulter les Logs
```bash
# Voir les erreurs récentes
/var/www/msa-app/scripts/view-logs.sh
```

### Sauvegardes
Les sauvegardes sont automatiques chaque nuit à 3h du matin.

Pour faire une sauvegarde manuelle :
```bash
/var/www/msa-app/scripts/backup-now.sh
```

## 🆘 Résolution de Problèmes

### Le Site Ne Répond Plus
```bash
# Redémarrer tous les services
/var/www/msa-app/scripts/restart-all.sh
```

### Erreur 502 Bad Gateway
Cela signifie que le backend Node.js est arrêté :
```bash
pm2 restart all
pm2 logs
```

### Erreur de Base de Données
```bash
# Vérifier MySQL
sudo systemctl status mysql
sudo systemctl restart mysql
```

### Espace Disque Plein
```bash
# Vérifier l'espace
df -h

# Nettoyer les vieux logs
/var/www/msa-app/scripts/clean-logs.sh
```

## 🚨 Procédures d'Urgence

### Redémarrage Complet
```bash
# En cas de problème grave
sudo reboot

# Après redémarrage, tout devrait redémarrer automatiquement
# Sinon :
/var/www/msa-app/scripts/restart-all.sh
```

### Restaurer une Sauvegarde
```bash
# Lister les sauvegardes disponibles
ls -la /var/www/msa-app/backups/

# Restaurer (remplacer DATE par la date voulue)
/var/www/msa-app/scripts/restore-backup.sh DATE
```

### Contacts d'Urgence
- **Support Scaleway** : https://console.scaleway.com/support
- **Documentation** : Ce fichier + scripts dans /var/www/msa-app/scripts/

## 📊 Monitoring

### Vérifications Quotidiennes
1. Visitez https://votre-domaine.com - Le site doit charger
2. Connectez-vous avec un compte test
3. Vérifiez que Sens AI répond
4. Vérifiez l'espace disque : `df -h`

### Alertes Automatiques
Le système envoie des emails si :
- Le serveur est à court d'espace disque
- Les services sont arrêtés
- Les sauvegardes échouent

## 🔐 Sécurité

### Mises à Jour
```bash
# Chaque semaine
sudo apt update
sudo apt upgrade
```

### Certificats SSL
Les certificats Let's Encrypt se renouvellent automatiquement.
Pour vérifier :
```bash
sudo certbot certificates
```

## 📝 Notes Importantes

1. **JAMAIS** supprimer les dossiers uploads/ ou backups/
2. **TOUJOURS** faire une sauvegarde avant une grosse mise à jour
3. **GARDER** ce document à jour avec vos modifications
4. **TESTER** en local avant de déployer

## 🤝 Support

En cas de problème non résolu :
1. Vérifiez les logs : `pm2 logs`
2. Consultez ce guide
3. Utilisez les scripts de diagnostic
4. Contactez le support Scaleway si problème serveur

---

**Dernière mise à jour** : Décembre 2024
**Version** : 1.0
**Mainteneur** : Équipe MSA
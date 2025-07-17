// Configuration PM2 pour MSA
// Documentation: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      // Configuration de l'application backend
      name: 'msa-backend',
      script: './backend/server.js',
      cwd: '/var/www/msa-app',
      
      // Instances et mode cluster
      instances: 2, // Utiliser 2 instances pour la haute disponibilité
      exec_mode: 'cluster',
      
      // Variables d'environnement
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      
      // Gestion des erreurs et redémarrages
      error_file: '/var/www/msa-app/logs/pm2-error.log',
      out_file: '/var/www/msa-app/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Stratégie de redémarrage
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // Surveillance et auto-restart
      watch: false, // Ne pas surveiller les fichiers en production
      ignore_watch: ['node_modules', 'logs', 'uploads', '.git'],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Options Node.js
      node_args: '--max-old-space-size=1024',
      
      // Auto restart sur crash
      autorestart: true,
      
      // Variables d'environnement depuis .env
      env_file: '/var/www/msa-app/backend/.env'
    },
    
    {
      // Configuration du serveur WebRTC (si séparé)
      name: 'msa-webrtc',
      script: './backend/webrtcServer.js',
      cwd: '/var/www/msa-app',
      
      // Une seule instance pour WebRTC
      instances: 1,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      
      // Logs séparés pour WebRTC
      error_file: '/var/www/msa-app/logs/webrtc-error.log',
      out_file: '/var/www/msa-app/logs/webrtc-out.log',
      
      // Redémarrage
      max_restarts: 5,
      max_memory_restart: '500M',
      
      // Auto restart
      autorestart: true,
      
      // Désactiver si le fichier n'existe pas
      // Commenter cette section si vous n'avez pas de serveur WebRTC séparé
    }
  ],
  
  // Configuration du déploiement (optionnel)
  deploy: {
    production: {
      user: 'root',
      host: 'VOTRE_IP_SERVEUR',
      ref: 'origin/master',
      repo: 'https://github.com/votre-username/msa.git',
      path: '/var/www/msa-app',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};

// Conseils d'utilisation:
// 
// 1. Démarrer l'application:
//    pm2 start ecosystem.config.js
//
// 2. Sauvegarder la configuration:
//    pm2 save
//    pm2 startup
//
// 3. Voir les logs:
//    pm2 logs msa-backend
//
// 4. Monitorer:
//    pm2 monit
//
// 5. Recharger sans downtime:
//    pm2 reload ecosystem.config.js
//
// 6. Voir le statut:
//    pm2 status
//
// 7. Arrêter:
//    pm2 stop msa-backend
//
// 8. Redémarrer:
//    pm2 restart msa-backend
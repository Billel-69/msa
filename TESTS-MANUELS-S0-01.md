# Tests Manuels S0-01 - Configuration Docker

## Environnement de test
- Date : 21/07/2025
- OS : WSL2 Ubuntu
- Docker version : (docker --version)
- docker-compose version : (docker compose version)

## Tests effectués ✅

### 1. Build des images
```bash
docker compose build
```
- ✅ Backend construit avec succès
- ✅ Frontend construit avec succès (build React multi-stage)
- ✅ Pas d'erreurs durant le build

### 2. Démarrage des services
```bash
docker compose up -d
```
- ✅ MySQL démarre et devient healthy
- ✅ MongoDB démarre et devient healthy
- ✅ Redis démarre et devient healthy
- ✅ Backend démarre et se connecte aux bases
- ✅ Frontend démarre et sert l'application

### 3. Vérification des endpoints
- ✅ Frontend accessible : http://localhost:3000
  - Status HTTP 200
  - Page React servie correctement
- ✅ Backend API accessible : http://localhost:5000
  - Retourne JSON avec message de bienvenue
- ✅ Health check backend : http://localhost:5000/health
  - Retourne {"status":"healthy","db":"connected"}

### 4. Vérification des logs
```bash
docker compose logs backend
```
- ✅ Pas d'erreurs critiques
- ✅ Connexion MySQL établie
- ✅ Services initialisés correctement

### 5. Performance
- ✅ Temps de démarrage < 60 secondes (après pull des images)
- ✅ Tous les healthchecks passent

## Problèmes rencontrés et solutions

1. **Problème** : Backend unhealthy avec healthcheck curl
   - **Solution** : Remplacé par wget (disponible dans alpine)

2. **Problème** : Connexion MySQL refusée (ECONNREFUSED ::1:3306)
   - **Solution** : Utiliser process.env.DB_HOST au lieu de 'localhost' hardcodé

3. **Problème** : Groupe nginx déjà existant dans l'image
   - **Solution** : Utiliser le groupe existant au lieu de le recréer

## Structure finale
- 5 conteneurs : frontend, backend, mysql, mongodb, redis
- Réseau isolé : msa-network
- Volumes persistants pour les données
- Healthchecks sur tous les services
- Utilisateurs non-root pour la sécurité

## Commandes utiles
```bash
# Voir l'état
docker compose ps

# Voir les logs
docker compose logs -f [service]

# Arrêter tout
docker compose down

# Nettoyer tout (avec volumes)
docker compose down -v
```
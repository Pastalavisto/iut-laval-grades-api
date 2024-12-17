# IUT Laval Grades API

API de gestion des notes pour l'IUT de Laval. Cette API permet aux professeurs de gérer les notes des étudiants et de générer des relevés de notes.

## Fonctionnalités

- 🔐 Authentification JWT
- 📊 Gestion des notes
- 📝 Génération de relevés en PDF
- 📈 Statistiques par étudiant/cours
- 📚 Documentation Swagger

## Documentation

La documentation de l'API est disponible ici : [https://itsalexousd.github.io/iut-laval-grades-api/](https://itsalexousd.github.io/iut-laval-grades-api/)

## Installation

### Cloner le projet

```bash
git clone https://github.com/itsalexousd/iut-laval-grades-api.git
cd iut-laval-grades-api
```

### Installer les dépendances

```bash
npm install
```

### Copier le fichier d'environnement

```bash
cp .env.example .env
```

## Base de données

### Lancer la base de données

```bash
docker-compose up -d
```

## Développement

### Lancer en mode développement

```bash
npm run dev
```

### Lancer les tests

```bash
npm test
```

### Vérifier le linting

```bash
npm run lint
```

## Production

### Compiler le projet

```bash
npm run build
```

### Lancer en production

```bash
npm run db:setup && npm run start:prod
```

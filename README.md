# Application de bibliothèque de film.

## Description

L'application contient 2 tables en base de données, une pour les utilisateurs et une pour stocker les films. Une table supplémentaire permet aux utilisateurs d'ajouter un ou plusieurs films en favori.

## Prérequis

L'application utilise les outils suivants :

- Docker Desktop

## Installation

Clonez le dépôt :

```bash
git clone https://github.com/remiantoine/projetnode.git
cd [racine du projet]
```

Installez les dépendances :

```bash
npm install
```

## Exécution des migrations


```bash
# Migration des tables
knex migrate:up 0-film.js
knex migrate:up 0-user.js

# Annuler la migration
knex migrate:down
```
## Variables d'environnement
```bash
# Creez le fichier .env à la racine du projet si absent avec le contenu suivant :
SMTP_HOST = 'smtp.example.com'
SMTP_PORT = 587
SMTP_SECURE = 'true'
```

## Démarrer le projet
Exécutez les commandes suivantes pour démarrer l'application :

```bash
## Le projet attend le conteneur sur le port 3307.
docker run -d --name hapi-mysql -e MYSQL_ROOT_PASSWORD=hapi -e MYSQL_DATABASE=user mysql:8.0 -p 3307:3306 --default-authentication-plugin=mysql_native_password

npm start
```

## Auteurs

- **Antoine Rémi** - [Mon Profil GitHub](https://github.com/remiantoine)



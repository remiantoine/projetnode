'use strict';

const Joi = require('joi')

module.exports = [
    {
        method: 'post',
        path: '/user',
        options: {
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().min(3).example('John').description('Firstname of the user'),
                    lastName: Joi.string().min(3).example('Doe').description('Lastname of the user'),
                    password: Joi.string().min(8).example('Password'),
                    mail: Joi.string().min(8).example('john.doe@gmail.com'),
                    createdAt: Joi.date(),
                    updatedAt: Joi.date()
                })
            }
        },
        handler: async (request, h) => {

            const { userService } = request.services();

            return userService.create(request.payload);
        }
    },
    {
        method: 'get',
        path: '/users',
        options: {
            tags: ['api'],
            description: 'Récupère la liste des utilisateurs',
            notes: 'Cette route retourne tous les utilisateurs enregistrés.',
        },
        handler: async (request, h) => {
            // Récupérer le UserService à partir du conteneur de services
            const userService = request.server.services().userService;

            // Appel au service pour obtenir les utilisateurs
            const users = await userService.getAllUsers();

            return users;
        }
    },
    {
        method: 'delete',
        path: '/user/{id}',
        options: {
            tags: ['api'],
            description: 'Supprime un utilisateur par son identifiant',
            notes: 'Cette route supprime un utilisateur existant si l’identifiant est valide.',
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().description('L\'identifiant unique de l\'utilisateur')
                })
            }
        },
        handler: async (request, h) => {
            const userService = request.server.services().userService;
            const { id } = request.params;

            // Appelle la méthode du service pour la suppression
            await userService.deleteUserById(id);

            // Réponse vide en cas de succès
            return '';
        }
    },
    {
        method: 'patch',
        path: '/user/{id}',
        options: {
            tags: ['api'],
            description: 'Met à jour partiellement un utilisateur par son identifiant',
            notes: 'Cette route permet de mettre à jour certains champs d\'un utilisateur existant.',
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().description('L\'identifiant unique de l\'utilisateur')
                }),
                payload: Joi.object({
                    firstName: Joi.string().min(3).example('John').description('Prénom de l\'utilisateur'),
                    lastName: Joi.string().min(3).example('Doe').description('Nom de l\'utilisateur'),
                    password: Joi.string().min(8).example('Password123').description('Mot de passe de l\'utilisateur'),
                    mail: Joi.string().email().example('john.doe@gmail.com').description('Email de l\'utilisateur')
                }).min(1) // Au moins un champ doit être fourni
            }
        },
        handler: async (request, h) => {
            const userService = request.server.services().userService;
            const { id } = request.params;
            const updates = request.payload;

            // Appelle la méthode du service pour mettre à jour l'utilisateur
            const updatedUser = await userService.updateUserById(id, updates);

            return updatedUser;
        }
    },
    {
        method: 'post',
        path: '/user/login',
        options: {
            tags: ['api'],
            description: 'Authentifie un utilisateur avec son email et mot de passe',
            notes: 'Cette route vérifie les informations d\'authentification et retourne une réponse de succès ou une erreur 401.',
            validate: {
                payload: Joi.object({
                    mail: Joi.string().email().required().example('john.doe@gmail.com').description('Email de l\'utilisateur'),
                    password: Joi.string().min(8).required().example('Password123').description('Mot de passe de l\'utilisateur')
                })
            }
        },
        handler: async (request, h) => {
            const userService = request.server.services().userService;
            const { mail, password } = request.payload;

            try {
                const isAuthenticated = await userService.authenticateUser(mail, password);
                if (isAuthenticated) {
                    return { login: 'successful' };
                }
                return h.response({ error: 'Unauthorized' }).code(401);
            } catch (err) {
                return h.response({ error: err.message }).code(401);
            }
        }
    }
];
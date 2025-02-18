'use strict';

const Joi = require('joi');
const Jwt = require('@hapi/jwt');
const MailService = require('../services/mail'); // Chemin relatif au fichier
const nodemailer = require('nodemailer');

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
            },
            auth: false
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
            auth: {
                scope: ['admin', 'user']
            },
            tags: ['api'],
            description: 'Récupère la liste des utilisateurs',
            notes: 'Cette route retourne tous les utilisateurs enregistrés.'
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
            auth: {
                scope: ['admin']
            },
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
            auth: {
                scope: ['admin']
            },
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
            },
            auth: false
        },
        handler: async (request, h) => {
            const userService = request.server.services().userService;
            const { mail, password } = request.payload;

            try {

                const user = await userService.authenticateAndFetchUser(mail, password);
                if (user) {
                    return Jwt.token.generate(
                        {
                            aud: 'urn:audience:iut',
                            iss: 'urn:issuer:iut',
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.mail,
                            scope: [user.scope] //Le scope du user
                        },
                        {
                            key: 'random_string',
                            algorithm: 'HS512'
                        },
                        {
                            ttlSec: 14400 // 4 hours
                        }
                    );
                }

                return h.response({ error: 'Unauthorized' }).code(401);
            }
            catch (err) {
                return h.response({ error: err.message }).code(401);
            }
        }
    },
    {
        method: 'patch',
        path: '/user/promote',
        options: {
            tags: ['api'],
            description: 'Permet à un administrateur d\'octroyer le rôle admin à un utilisateur',
            notes: 'Cette route est accessible uniquement aux utilisateurs avec le rôle admin.',
            validate: {
                payload: Joi.object({
                    id: Joi.number().integer().required().description('L\'identifiant unique de l\'utilisateur à promouvoir')
                })
            },
            auth: {
                scope: ['admin']
            }
        },
        handler: async (request, h) => {
            const userService = request.server.services().userService;
            const { id } = request.payload;


            // Promotion de l'utilisateur au rôle admin
            const updatedUser = await userService.promoteUserToAdmin(id);
            return { message: `Utilisateur avec l\'ID ${id} promu au rôle admin.`, user: updatedUser };
        }
    },
    {
        method: 'POST',
        path: '/send-email',
        options: {
            validate: {
                payload: Joi.object({
                    from: Joi.string().email().required(),
                    to: Joi.string().email().required(),
                    subject: Joi.string().min(1).required(),
                    text: Joi.string().min(1).required(),
                    html: Joi.string().optional()
                })
            }
        },
        handler: async (request, h) => {
            const { from, to, subject, text, html } = request.payload;

            try {
                // Instanciation directe du transporteur nodemailer
                const testAccount = await nodemailer.createTestAccount();
                const transporter = nodemailer.createTransport({
                    host: testAccount.smtp.host,
                    port: testAccount.smtp.port,
                    secure: testAccount.smtp.secure,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });

                // Configuration de l'email

                const info = await transporter.sendMail({
                    from: from || 'no-reply@example.com',
                    to,
                    subject,
                    text,
                    html
                });

                return h.response({
                    success: true,
                    message: 'Email sent successfully',
                    messageId: info.messageId,
                    preview: nodemailer.getTestMessageUrl(info)
                }).code(200);
            }
            catch (err) {
                return h.response({
                    success: false,
                    message: 'Failed to send email',
                    error: err.message
                }).code(500);
            }
        }
    },
    {
        method: 'post',
        path: '/favoritemovie',
        options: {
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    UserId: Joi.number().integer().required(),
                    FilmId: Joi.number().integer().required()
                })
            },
            auth: {
                scope: ['admin','user']
            }
        },
        handler: async (request, h) => {

            const userService = request.server.services().userService;
            const { UserId, FilmId } = request.payload;
            try {
                return await userService.addFavoriteMovie(UserId, FilmId);
            }
            catch (error) {
                const statusCode = error.statusCode || 500;
                return h.response({ error: error.message }).code(statusCode);
            }

        }
    },
    {
        method: 'DELETE',
        path: '/favoritemovie',
        options: {
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    UserId: Joi.number().integer().required(),
                    FilmId: Joi.number().integer().required()
                })
            },
            auth: {
                scope: ['admin','user']
            }
        },
        handler: async (request, h) => {
            const { UserId, FilmId } = request.payload;
            const userService = request.services().userService;

            try {
                const response = await userService.deleteFavoriteMovieById(UserId, FilmId);
                return h.response(response).code(200);
            }
            catch (err) {
                return h.response({ error: err.message }).code(400);
            }
        }
    }


];

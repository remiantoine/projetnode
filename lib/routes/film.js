'use strict';

const Joi = require('joi');
const Jwt = require('@hapi/jwt');

module.exports = [
    {
        method: 'post',
        path: '/film',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    title: Joi.string().min(3).required(),
                    description: Joi.string().min(3),
                    releasedate: Joi.date().max('now') // Date de sortie du film ne peut pas être dans le futur
                        .required()
                        .messages({
                            'date.format': 'La date doit être au format JJ/MM/AAAA.',
                            'date.max': 'La date ne peut pas être ultérieure à aujourd\'hui.',
                        }),
                    producer: Joi.string().min(3).required(),
                    createdAt: Joi.date(),
                    updatedAt: Joi.date()
                })
            }
        },
        handler: async (request, h) => {
            const { filmService } = request.services();

            return filmService.create(request.payload);
        }
    },
    {
        method: 'delete',
        path: '/film/{id}',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api'],
            description: 'Supprime un film par son identifiant',
            notes: 'Cette route supprime un film existant si l’identifiant est valide.',
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().description('L\'identifiant unique du film')
                })
            }
        },
        handler: async (request, h) => {
            const userService = request.server.services().filmService;
            const { id } = request.params;

            // Appelle la méthode du service pour la suppression
            await userService.deleteFilmById(id);

            // Réponse vide en cas de succès
            return '';
        }
    },
    {
        method: 'patch',
        path: '/film/{id}',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api'],
            description: 'Met à jour partiellement un film par son identifiant',
            notes: 'Cette route permet de mettre à jour certains champs d\'un film existant.',
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().description('L\'identifiant unique du film')
                }),
                payload: Joi.object({
                    title: Joi.string().min(3),
                    description: Joi.string().min(3),
                    releasedate: Joi.date().max('now') // Date de sortie du film ne peut pas être dans le futur
                        .messages({
                            'date.format': 'La date doit être au format JJ/MM/AAAA.',
                            'date.max': 'La date ne peut pas être ultérieure à aujourd\'hui.',
                        }),
                    producer: Joi.string().min(3)
                }).min(1) // Au moins un champ doit être fourni
            }
        },
        handler: async (request, h) => {
            const filmService = request.server.services().filmService;
            const { id } = request.params;
            const updates = request.payload;

            // Appelle la méthode du service pour mettre à jour l'utilisateur
            return await filmService.updateFilmById(id, updates);
        }
    }
];

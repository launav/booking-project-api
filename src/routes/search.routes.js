const router = require('express').Router();
const { searchRooms } = require('../controllers/search.controller');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Búsqueda de habitaciones
 */

/**
 * @swagger
 * /api/rooms/search:
 *   get:
 *     summary: Buscar habitaciones con filtros
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         description: Filtrar por ciudad del hotel
 *       - in: query
 *         name: checkIn
 *         schema: { type: string, format: date }
 *         description: Fecha de entrada (YYYY-MM-DD)
 *       - in: query
 *         name: checkOut
 *         schema: { type: string, format: date }
 *         description: Fecha de salida (YYYY-MM-DD)
 *       - in: query
 *         name: capacity
 *         schema: { type: integer }
 *         description: Capacidad mínima de viajeros
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista de habitaciones filtradas
 */
router.get('/search', searchRooms);

module.exports = router;
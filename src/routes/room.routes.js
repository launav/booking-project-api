const router = require('express').Router();
const ctrl   = require('../controllers/room.controller');
const { auth, isAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Gestión de habitaciones
 */

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Obtener todas las habitaciones
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema: { type: integer }
 *         description: Filtrar habitaciones por hotel
 *     responses:
 *       200:
 *         description: Lista de habitaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Room' }
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Obtener una habitación por ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Habitación encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Room' }
 *       404:
 *         description: Habitación no encontrada
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Crear una habitación (solo admin)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotel_id, room_number, type, capacity, price]
 *             properties:
 *               hotel_id:    { type: integer, example: 1 }
 *               room_number: { type: string,  example: "101" }
 *               type:        { type: string,  example: doble }
 *               capacity:    { type: integer, example: 2 }
 *               price:       { type: number,  example: 120.50 }
 *               description: { type: string,  example: "Vistas al mar" }
 *               status:      { type: string,  example: available }
 *     responses:
 *       201:
 *         description: Habitación creada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (solo admin)
 */
router.post('/', auth, isAdmin, ctrl.create);

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Actualizar una habitación (solo admin)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Room' }
 *     responses:
 *       200:
 *         description: Habitación actualizada
 *       404:
 *         description: Habitación no encontrada
 */
router.put('/:id', auth, isAdmin, ctrl.update);

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Eliminar una habitación (solo admin)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Habitación eliminada
 *       404:
 *         description: Habitación no encontrada
 */
router.delete('/:id', auth, isAdmin, ctrl.remove);

module.exports = router;

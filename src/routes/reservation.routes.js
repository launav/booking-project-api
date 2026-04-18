const router = require('express').Router();
const ctrl   = require('../controllers/reservation.controller');
const { auth, isAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Gestión de reservas
 */

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Obtener todas las reservas (solo admin)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Reservation' }
 *       403:
 *         description: No autorizado
 */
router.get('/', auth, isAdmin, ctrl.getAll);

/**
 * @swagger
 * /api/reservations/my:
 *   get:
 *     summary: Obtener las reservas del usuario autenticado
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Reservation' }
 */
router.get('/my', auth, ctrl.getMine);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Obtener una reserva por ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reserva encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Reservation' }
 *       403:
 *         description: No autorizado para ver esta reserva
 *       404:
 *         description: Reserva no encontrada
 */
router.get('/:id', auth, ctrl.getById);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Crear una reserva
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [room_id, hotel_id, check_in_date, check_out_date]
 *             properties:
 *               room_id:        { type: integer, example: 3 }
 *               hotel_id:       { type: integer, example: 1 }
 *               check_in_date:  { type: string, format: date, example: "2025-06-01" }
 *               check_out_date: { type: string, format: date, example: "2025-06-07" }
 *     responses:
 *       201:
 *         description: Reserva creada
 *       400:
 *         description: Fechas inválidas o conflicto de disponibilidad
 *       401:
 *         description: No autenticado
 */
router.post('/', auth, ctrl.create);

/**
 * @swagger
 * /api/reservations/{id}/status:
 *   patch:
 *     summary: Actualizar el estado de una reserva (solo admin)
 *     tags: [Reservations]
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
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Estado inválido
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Reserva no encontrada
 */
router.patch('/:id/status', auth, isAdmin, ctrl.updateStatus);

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Cancelar una reserva
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *       403:
 *         description: No autorizado para cancelar esta reserva
 *       404:
 *         description: Reserva no encontrada
 */
router.delete('/:id', auth, ctrl.remove);

module.exports = router;

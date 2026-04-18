const router = require('express').Router();
const ctrl = require('../controllers/hotel.controller');
const { auth, isAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: Gestión de hoteles
 */

/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Obtener todos los hoteles
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: Lista de hoteles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Hotel' }
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     summary: Obtener un hotel por ID
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Hotel encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Hotel' }
 *       404:
 *         description: Hotel no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/hotels:
 *   post:
 *     summary: Crear un hotel (solo admin)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, city]
 *             properties:
 *               name:        { type: string, example: Hotel Sol }
 *               address:     { type: string, example: "Calle Gran Vía 10" }
 *               city:        { type: string, example: Madrid }
 *               phone:       { type: string, example: "912345678" }
 *               email:       { type: string, example: info@hotelsol.com }
 *               description: { type: string, example: "Hotel de 4 estrellas" }
 *     responses:
 *       201:
 *         description: Hotel creado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (solo admin)
 */
router.post('/', auth, isAdmin, ctrl.create);

/**
 * @swagger
 * /api/hotels/{id}:
 *   put:
 *     summary: Actualizar un hotel (solo admin)
 *     tags: [Hotels]
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
 *           schema: { $ref: '#/components/schemas/Hotel' }
 *     responses:
 *       200:
 *         description: Hotel actualizado
 *       404:
 *         description: Hotel no encontrado
 */
router.put('/:id', auth, isAdmin, ctrl.update);

/**
 * @swagger
 * /api/hotels/{id}:
 *   delete:
 *     summary: Eliminar un hotel (solo admin)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Hotel eliminado
 *       409:
 *         description: El hotel tiene reservas activas
 *       404:
 *         description: Hotel no encontrado
 */
router.delete('/:id', auth, isAdmin, ctrl.remove);

module.exports = router;

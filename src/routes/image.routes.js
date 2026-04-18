const router = require('express').Router();
const ctrl   = require('../controllers/image.controller');
const { auth, isAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Gestión de imágenes de hoteles y habitaciones
 */

/**
 * @swagger
 * /api/images:
 *   get:
 *     summary: Obtener imágenes de un hotel o habitación
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema: { type: integer }
 *         description: ID del hotel
 *       - in: query
 *         name: room_id
 *         schema: { type: integer }
 *         description: ID de la habitación
 *     responses:
 *       200:
 *         description: Lista de imágenes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Image' }
 */
router.get('/', ctrl.getByEntity);

/**
 * @swagger
 * /api/images/hotel/{hotel_id}:
 *   post:
 *     summary: Subir imagen de un hotel (solo admin)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotel_id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo JPEG, JPG, PNG o WebP (máx 5MB)
 *     responses:
 *       201:
 *         description: Imagen subida correctamente
 *       400:
 *         description: Archivo inválido
 *       403:
 *         description: No autorizado
 */
router.post('/hotel/:hotel_id', auth, isAdmin, upload.single('image'), ctrl.uploadHotelImage);

/**
 * @swagger
 * /api/images/room/{room_id}:
 *   post:
 *     summary: Subir imagen de una habitación (solo admin)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: room_id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo JPEG, JPG, PNG o WebP (máx 5MB)
 *     responses:
 *       201:
 *         description: Imagen subida correctamente
 *       400:
 *         description: Archivo inválido
 *       403:
 *         description: No autorizado
 */
router.post('/room/:room_id', auth, isAdmin, upload.single('image'), ctrl.uploadRoomImage);

/**
 * @swagger
 * /api/images/{id}:
 *   delete:
 *     summary: Eliminar una imagen (solo admin)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Imagen eliminada
 *       404:
 *         description: Imagen no encontrada
 */
router.delete('/:id', auth, isAdmin, ctrl.remove);

module.exports = router;

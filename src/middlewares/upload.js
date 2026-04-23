// Configuración multer para carga de archivos
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Configuración de multer para guardar imágenes en /uploads.
 *
 * Estructura de carpetas generada:
 *   uploads/
 *     hoteles/    -> imágenes de hotel
 *     habitaciones/ -> imágenes de habitación
 *
 * El nombre del archivo se genera como:
 *   <tipo>_<timestamp>_<nombre-original-saneado>.<ext>
 *   Ej: hotel_1715000000000_exterior.jpg
 */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Decide subcarpeta según la ruta que llama al middleware
    const isHotel = req.baseUrl.includes('hotel');
    const folder = isHotel ? 'hoteles' : 'habitaciones';
    const dest = path.join(process.env.UPLOADS_PATH || 'uploads', folder);

    // Crear la carpeta si no existe
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },

  filename: (req, file, cb) => {
    const isHotel = req.baseUrl.includes('hotel');
    const prefix = isHotel ? 'hotel' : 'room';
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${prefix}_${Date.now()}_${safeName}${ext}`);
  },
});

// Solo se permiten imágenes
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
});

module.exports = upload;

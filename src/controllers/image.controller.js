const db   = require('../config/db');
const fs   = require('fs');
const path = require('path');

/**
 * La URL que se guarda en BD es la ruta relativa desde la raíz del servidor:
 *   uploads/hoteles/hotel_1715000000000_exterior.jpg
 *
 * El frontend la construye concatenando la base de la API:
 *   http://localhost:3000/uploads/hoteles/hotel_1715000000000_exterior.jpg
 */

// GET /api/images?hotel_id=1  |  ?room_id=2
const getByEntity = async (req, res) => {
  const { hotel_id, room_id } = req.query;

  if (!hotel_id && !room_id) {
    return res.status(400).json({ message: 'Indica hotel_id o room_id como query param' });
  }

  try {
    let query, params;
    if (hotel_id) {
      query  = 'SELECT * FROM image WHERE id_hotel = ?';
      params = [hotel_id];
    } else {
      query  = 'SELECT * FROM image WHERE id_room = ?';
      params = [room_id];
    }

    const [rows] = await db.query(query, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error('image getByEntity error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/images/hotel/:hotel_id  [admin]
const uploadHotelImage = async (req, res) => {
  const { hotel_id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
  }

  const url = req.file.path.replace(/\\/g, '/');

  try {
    const [result] = await db.query(
      'INSERT INTO image (id_hotel, id_room, url) VALUES (?, NULL, ?)',
      [hotel_id, url]
    );
    return res.status(201).json({
      message:  'Imagen subida correctamente',
      id_image: result.insertId,
      url,
    });
  } catch (err) {
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    console.error('image uploadHotelImage error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/images/room/:room_id  [admin]
const uploadRoomImage = async (req, res) => {
  const { room_id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
  }

  const url = req.file.path.replace(/\\/g, '/');

  try {
    const [result] = await db.query(
      'INSERT INTO image (id_hotel, id_room, url) VALUES (NULL, ?, ?)',
      [room_id, url]
    );
    return res.status(201).json({
      message:  'Imagen subida correctamente',
      id_image: result.insertId,
      url,
    });
  } catch (err) {
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    console.error('image uploadRoomImage error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/images/:id  [admin]
const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM image WHERE id_image = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    const filePath = rows[0].url;

    await db.query('DELETE FROM image WHERE id_image = ?', [id]);

    // Solo borrar archivo físico si es ruta local (no URL externa tipo http/https)
    if (filePath && typeof filePath === 'string' && !filePath.startsWith('http')) {
      fs.unlink(filePath, (err) => {
        if (err) console.warn('No se pudo borrar el archivo físico:', filePath);
      });
    }

    return res.status(200).json({ message: 'Imagen eliminada' });
  } catch (err) {
    console.error('image remove error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getByEntity, uploadHotelImage, uploadRoomImage, remove };

const db = require('../config/db');
const fs = require('fs');

// GET /api/images?hotel_id=1  |  ?room_id=2
const getByEntity = async (req, res) => {
  const { hotel_id, room_id } = req.query;

  if (!hotel_id && !room_id) {
    return res.status(400).json({ message: 'Indica hotel_id o room_id como query param' });
  }

  try {
    let result;

    if (hotel_id) {
      result = await db.query(
        'SELECT * FROM image WHERE id_hotel = $1',
        [hotel_id]
      );
    } else {
      result = await db.query(
        'SELECT * FROM image WHERE id_room = $1',
        [room_id]
      );
    }

    return res.status(200).json(result.rows);

  } catch (err) {
    console.error('image getByEntity error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/images/hotel/:hotel_id
const uploadHotelImage = async (req, res) => {
  const { hotel_id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
  }

  const url = req.file.path.replace(/\\/g, '/');

  try {
    const result = await db.query(
      'INSERT INTO image (id_hotel, id_room, url) VALUES ($1, NULL, $2) RETURNING id_image',
      [hotel_id, url]
    );

    return res.status(201).json({
      message: 'Imagen subida correctamente',
      id_image: result.rows[0].id_image,
      url,
    });

  } catch (err) {
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    console.error('image uploadHotelImage error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/images/room/:room_id
const uploadRoomImage = async (req, res) => {
  const { room_id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
  }

  const url = req.file.path.replace(/\\/g, '/');

  try {
    const result = await db.query(
      'INSERT INTO image (id_hotel, id_room, url) VALUES (NULL, $1, $2) RETURNING id_image',
      [room_id, url]
    );

    return res.status(201).json({
      message: 'Imagen subida correctamente',
      id_image: result.rows[0].id_image,
      url,
    });

  } catch (err) {
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    console.error('image uploadRoomImage error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/images/url
const saveUrl = async (req, res) => {
  const { id_room, id_hotel, url } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ message: 'La URL es obligatoria' });
  }

  if (!id_room && !id_hotel) {
    return res.status(400).json({ message: 'Indica id_room o id_hotel' });
  }

  try {
    const result = await db.query(
      'INSERT INTO image (id_hotel, id_room, url) VALUES ($1, $2, $3) RETURNING id_image',
      [id_hotel ?? null, id_room ?? null, url.trim()]
    );

    return res.status(201).json({
      message: 'Imagen guardada',
      id_image: result.rows[0].id_image,
      url
    });

  } catch (err) {
    console.error('image saveUrl error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/images/:id
const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM image WHERE id_image = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    const filePath = result.rows[0].url;

    await db.query(
      'DELETE FROM image WHERE id_image = $1',
      [id]
    );

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

module.exports = { getByEntity, uploadHotelImage, uploadRoomImage, saveUrl, remove };
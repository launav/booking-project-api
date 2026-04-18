const db = require('../config/db');

// GET /api/rooms  (opcionalmente filtrar por ?hotel_id=1)
const getAll = async (req, res) => {
  const { hotel_id } = req.query;
  try {
    let query  = 'SELECT * FROM room';
    let params = [];

    if (hotel_id) {
      query  += ' WHERE id_hotel = ?';
      params  = [hotel_id];
    }

    query += ' ORDER BY id_room ASC';
    const [rows] = await db.query(query, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error('room getAll error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/rooms/:id
const getById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM room WHERE id_room = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Habitación no encontrada' });
    }
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('room getById error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/rooms  [admin]
const create = async (req, res) => {
  const { id_hotel, room_number, type, capacity, price_per_night, description, status } = req.body;

  if (!id_hotel || !room_number || !type || !capacity || !price_per_night) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO room (id_hotel, room_number, type, capacity, price_per_night, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_hotel, room_number, type, capacity, price_per_night,
       description || null, status || 'available']
    );
    return res.status(201).json({ message: 'Habitación creada', id_room: result.insertId });
  } catch (err) {
    console.error('room create error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/rooms/:id  [admin]
const update = async (req, res) => {
  const { id } = req.params;
  const { room_number, type, capacity, price_per_night, description, status } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE room SET room_number = ?, type = ?, capacity = ?, price_per_night = ?,
       description = ?, status = ? WHERE id_room = ?`,
      [room_number, type, capacity, price_per_night, description || null, status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Habitación no encontrada' });
    }
    return res.status(200).json({ message: 'Habitación actualizada' });
  } catch (err) {
    console.error('room update error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/rooms/:id  [admin]
const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM room WHERE id_room = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Habitación no encontrada' });
    }
    return res.status(200).json({ message: 'Habitación eliminada' });
  } catch (err) {
    console.error('room remove error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, remove };

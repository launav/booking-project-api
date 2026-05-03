const db = require('../config/db');

// GET /api/rooms?page=1&limit=10&hotel_id=1
const getAll = async (req, res) => {
  const { hotel_id } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  try {
    const whereClause = hotel_id ? 'WHERE id_hotel = ?' : '';
    const baseParams = hotel_id ? [hotel_id] : [];

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM room ${whereClause}`,
      baseParams
    );
    const [rows] = await db.query(
      `SELECT * FROM room ${whereClause} ORDER BY id_room ASC LIMIT ? OFFSET ?`,
      [...baseParams, limit, offset]
    );
    return res.status(200).json({
      data: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
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

// GET /api/rooms/:id/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD  [public]
const checkAvailability = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res.status(400).json({ message: 'Se requieren checkIn y checkOut' });
  }

  try {
    const [conflicts] = await db.query(
      `SELECT id_reservation FROM reservation
       WHERE id_room = ?
         AND reservation_status != 'cancelled'
         AND check_in_date  < ?
         AND check_out_date > ?`,
      [id, checkOut, checkIn]
    );
    return res.status(200).json({ available: conflicts.length === 0 });
  } catch (err) {
    console.error('checkAvailability error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, remove, checkAvailability };

const db = require('../config/db');

// GET /api/rooms?page=1&limit=10&hotel_id=1
const getAll = async (req, res) => {
  const { hotel_id } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  try {
    let whereClause = '';
    let params = [];

    if (hotel_id) {
      whereClause = 'WHERE id_hotel = $1';
      params.push(hotel_id);
    }

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM room ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    const result = await db.query(
      `SELECT * FROM room ${whereClause} ORDER BY id_room ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      data: result.rows,
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
    const result = await db.query(
      'SELECT * FROM room WHERE id_room = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Habitación no encontrada' });
    }

    return res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error('room getById error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/rooms
const create = async (req, res) => {
  const { id_hotel, room_number, type, capacity, price_per_night, description, status } = req.body;

  if (!id_hotel || !room_number || !type || !capacity || !price_per_night) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const result = await db.query(
      `INSERT INTO room (id_hotel, room_number, type, capacity, price_per_night, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_room`,
      [
        parseInt(id_hotel),
        room_number,
        type,
        parseInt(capacity),
        parseFloat(price_per_night),
        description || null,
        status || 'available'
      ]
    );

    return res.status(201).json({
      message: 'Habitación creada',
      id_room: result.rows[0].id_room
    });

  } catch (err) {
    console.error('room create error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/rooms/:id
const update = async (req, res) => {
  const { id } = req.params;
  const { room_number, type, capacity, price_per_night, description, status } = req.body;

  try {
    const result = await db.query(
      `UPDATE room
       SET room_number = $1, type = $2, capacity = $3, price_per_night = $4,
           description = $5, status = $6
       WHERE id_room = $7`,
      [room_number, type, parseInt(capacity), parseFloat(price_per_night), description || null, status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Habitación no encontrada' });
    }

    return res.status(200).json({ message: 'Habitación actualizada', id_room: Number(id) });

  } catch (err) {
    console.error('room update error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/rooms/:id
const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM room WHERE id_room = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Habitación no encontrada' });
    }

    return res.status(200).json({ message: 'Habitación eliminada' });

  } catch (err) {
    console.error('room remove error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/rooms/:id/availability
const checkAvailability = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res.status(400).json({ message: 'Se requieren checkIn y checkOut' });
  }

  try {
    const result = await db.query(
      `SELECT id_reservation FROM reservation
       WHERE id_room = $1
         AND reservation_status != 'cancelled'
         AND check_in_date  < $2
         AND check_out_date > $3`,
      [id, checkOut, checkIn]
    );

    return res.status(200).json({
      available: result.rows.length === 0
    });

  } catch (err) {
    console.error('checkAvailability error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, remove, checkAvailability };

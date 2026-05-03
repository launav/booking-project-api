const db = require('../config/db');

// GET /api/reservations?page=1&limit=10
const getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query('SELECT COUNT(*)::int AS total FROM reservation');
    const total = countResult.rows[0].total;

    const result = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email,
              ro.room_number, ro.type, h.name AS hotel_name
       FROM reservation r
       JOIN "user" u ON r.id_user = u.id_user
       JOIN room ro  ON r.id_room = ro.id_room
       JOIN hotel h  ON r.id_hotel = h.id_hotel
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.status(200).json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });

  } catch (err) {
    console.error('reservation getAll error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/reservations/my
const getMine = async (req, res) => {
  const id_user = req.user.id_user;

  try {
    const result = await db.query(
      `SELECT r.*, ro.room_number, ro.type, h.name AS hotel_name
       FROM reservation r
       JOIN room ro ON r.id_room = ro.id_room
       JOIN hotel h ON r.id_hotel = h.id_hotel
       WHERE r.id_user = $1
       ORDER BY r.created_at DESC`,
      [id_user]
    );

    return res.status(200).json(result.rows);

  } catch (err) {
    console.error('reservation getMine error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/reservations/:id
const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT r.*, u.first_name, u.last_name,
              ro.room_number, ro.type, h.name AS hotel_name
       FROM reservation r
       JOIN "user" u ON r.id_user = u.id_user
       JOIN room ro  ON r.id_room = ro.id_room
       JOIN hotel h  ON r.id_hotel = h.id_hotel
       WHERE r.id_reservation = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const reservation = result.rows[0];

    if (req.user.role !== 'admin' && reservation.id_user !== req.user.id_user) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    return res.status(200).json(reservation);

  } catch (err) {
    console.error('reservation getById error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/reservations
const create = async (req, res) => {
  const { id_room, id_hotel, check_in_date, check_out_date } = req.body;
  const id_user = req.user.id_user;

  if (!id_room || !id_hotel || !check_in_date || !check_out_date) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  if (new Date(check_in_date) >= new Date(check_out_date)) {
    return res.status(400).json({ message: 'La fecha de entrada debe ser anterior a la de salida' });
  }

  try {
    const conflicts = await db.query(
      `SELECT id_reservation FROM reservation
       WHERE id_room = $1
         AND reservation_status != 'cancelled'
         AND check_in_date  < $2
         AND check_out_date > $3`,
      [id_room, check_out_date, check_in_date]
    );

    if (conflicts.rows.length > 0) {
      return res.status(409).json({ message: 'La habitación no está disponible en esas fechas' });
    }

    const result = await db.query(
      `INSERT INTO reservation (id_user, id_room, id_hotel, check_in_date, check_out_date, reservation_status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id_reservation`,
      [id_user, id_room, id_hotel, check_in_date, check_out_date]
    );

    return res.status(201).json({
      message: 'Reserva creada',
      id_reservation: result.rows[0].id_reservation,
    });

  } catch (err) {
    console.error('reservation create error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PATCH /api/reservations/:id/status
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Estado inválido. Usa: ${validStatuses.join(', ')}` });
  }

  try {
    const result = await db.query(
      'UPDATE reservation SET reservation_status = $1 WHERE id_reservation = $2',
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    return res.status(200).json({ message: 'Estado de reserva actualizado' });

  } catch (err) {
    console.error('reservation updateStatus error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/reservations/:id
const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM reservation WHERE id_reservation = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    if (req.user.role !== 'admin' && result.rows[0].id_user !== req.user.id_user) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    await db.query(
      "UPDATE reservation SET reservation_status = 'cancelled' WHERE id_reservation = $1",
      [id]
    );

    return res.status(200).json({ message: 'Reserva cancelada' });

  } catch (err) {
    console.error('reservation remove error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getMine, getById, create, updateStatus, remove };
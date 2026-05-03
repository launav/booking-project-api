const db = require('../config/db');

// GET /api/hotels?page=1&limit=10
const getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query('SELECT COUNT(*)::int AS total FROM hotel');
    const total = countResult.rows[0].total;

    const result = await db.query(
      'SELECT * FROM hotel ORDER BY id_hotel ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return res.status(200).json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });

  } catch (err) {
    console.error('hotel getAll error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/hotels/:id
const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM hotel WHERE id_hotel = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hotel no encontrado' });
    }

    return res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error('hotel getById error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/hotels
const create = async (req, res) => {
  const { name, address, city, phone, email, description } = req.body;

  if (!name || !address || !city) {
    return res.status(400).json({ message: 'Nombre, dirección y ciudad son obligatorios' });
  }

  try {
    const result = await db.query(
      `INSERT INTO hotel (name, address, city, phone, email, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_hotel`,
      [name, address, city, phone || null, email || null, description || null]
    );

    return res.status(201).json({
      message: 'Hotel creado',
      id_hotel: result.rows[0].id_hotel
    });

  } catch (err) {
    console.error('hotel create error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/hotels/:id
const update = async (req, res) => {
  const { id } = req.params;
  const { name, address, city, phone, email, description } = req.body;

  try {
    const result = await db.query(
      `UPDATE hotel 
       SET name = $1, address = $2, city = $3, phone = $4, email = $5, description = $6
       WHERE id_hotel = $7`,
      [name, address, city, phone || null, email || null, description || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Hotel no encontrado' });
    }

    return res.status(200).json({ message: 'Hotel actualizado', id_hotel: Number(id) });

  } catch (err) {
    console.error('hotel update error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/hotels/:id
const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM hotel WHERE id_hotel = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Hotel no encontrado' });
    }

    return res.status(200).json({ message: 'Hotel eliminado' });

  } catch (err) {
    // PostgreSQL foreign key error
    if (err.code === '23503') {
      return res.status(409).json({
        message: 'No se puede eliminar el hotel porque tiene reservas asociadas'
      });
    }

    console.error('hotel remove error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, create, update, remove };
const bcrypt = require('bcrypt');
const db = require('../config/db');

// GET /api/users?page=1&limit=10
const getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query('SELECT COUNT(*)::int AS total FROM "user"');
    const total = countResult.rows[0].total;

    const result = await db.query(
      `SELECT id_user, first_name, last_name, email, role, phone, address
       FROM "user"
       ORDER BY id_user ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.status(200).json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });

  } catch (err) {
    console.error('user getAll error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/users/:id
const getById = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin' && req.user.id_user !== Number(id)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const result = await db.query(
      `SELECT id_user, first_name, last_name, email, role, phone, address
       FROM "user"
       WHERE id_user = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error('user getById error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/users/:id
const update = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, address, password } = req.body;

  if (req.user.role !== 'admin' && req.user.id_user !== Number(id)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    let query;
    let params;

    if (password) {
      const newPassword = await bcrypt.hash(password, 10);

      query = `
        UPDATE "user"
        SET first_name = $1, last_name = $2, phone = $3, address = $4, password = $5
        WHERE id_user = $6
      `;
      params = [first_name, last_name, phone || null, address || null, newPassword, id];

    } else {
      query = `
        UPDATE "user"
        SET first_name = $1, last_name = $2, phone = $3, address = $4
        WHERE id_user = $5
      `;
      params = [first_name, last_name, phone || null, address || null, id];
    }

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ message: 'Usuario actualizado' });

  } catch (err) {
    console.error('user update error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/users/:id
const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM "user" WHERE id_user = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ message: 'Usuario eliminado' });

  } catch (err) {
    console.error('user remove error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, update, remove };
const bcrypt = require('bcrypt');
const db     = require('../config/db');

// GET /api/users  [admin]
const getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id_user, first_name, last_name, email, role, phone, address FROM user ORDER BY id_user ASC'
    );
    return res.status(200).json(rows);
  } catch (err) {
    console.error('user getAll error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/users/:id  [admin | propio usuario]
const getById = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin' && req.user.id_user !== Number(id)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id_user, first_name, last_name, email, role, phone, address FROM user WHERE id_user = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('user getById error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/users/:id  [admin | propio usuario]
const update = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, address, password } = req.body;

  if (req.user.role !== 'admin' && req.user.id_user !== Number(id)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    let newPassword = null;
    if (password) {
      newPassword = await bcrypt.hash(password, 10);
    }

    const [result] = await db.query(
      `UPDATE user
       SET first_name = ?, last_name = ?, phone = ?, address = ?
           ${newPassword ? ', password = ?' : ''}
       WHERE id_user = ?`,
      newPassword
        ? [first_name, last_name, phone || null, address || null, newPassword, id]
        : [first_name, last_name, phone || null, address || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.status(200).json({ message: 'Usuario actualizado' });
  } catch (err) {
    console.error('user update error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/users/:id  [admin]
const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM user WHERE id_user = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.status(200).json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error('user remove error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, update, remove };

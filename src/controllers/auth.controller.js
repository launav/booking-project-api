const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/auth/register
const VALID_ROLES = ['client', 'admin'];

const register = async (req, res) => {
  const { first_name, last_name, email, password, phone, address, role } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  const assignedRole = VALID_ROLES.includes(role) ? role : 'client';

  try {
    const [existing] = await db.query('SELECT id_user FROM user WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO user (first_name, last_name, email, password, role, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, hash, assignedRole, phone || null, address || null]
    );

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      id_user: result.insertId,
      role: assignedRole,
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id_user: user.id_user, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        id_user: user.id_user,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { register, login };

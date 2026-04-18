// Middleware para verificar JWT
const jwt = require('jsonwebtoken');

/**
 * Verifica que el request lleve un JWT válido en la cabecera Authorization.
 * Uso: router.get('/ruta', auth, controller)
 */
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id_user, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

/**
 * Verifica que el usuario autenticado tenga rol 'admin'.
 * Siempre debe ir después del middleware auth.
 * Uso: router.post('/ruta', auth, isAdmin, controller)
 */
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol admin' });
  }
  next();
};

module.exports = { auth, isAdmin };

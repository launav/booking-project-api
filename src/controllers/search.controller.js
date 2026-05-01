const db = require('../config/db');

/**
 * Búsqueda de habitaciones con filtros
 * GET /api/rooms/search?city=&checkIn=&checkOut=&capacity=&page=1&limit=10
 */
const searchRooms = async (req, res) => {
  const { city, checkIn, checkOut, capacity, page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  try {
    // Construir consulta dinámica
    let sql = `
      SELECT r.*, h.name as hotel_name, h.address as hotel_address, h.city as hotel_city
      FROM room r
      JOIN hotel h ON r.id_hotel = h.id_hotel
    `;

    const params = [];
    const conditions = [];

    // Filtrar por ciudad del hotel
    if (city) {
      conditions.push('LOWER(h.city) LIKE LOWER(?)');
      params.push(`%${city}%`);
    }

    // Filtrar por capacidad mínima
    if (capacity) {
      conditions.push('r.capacity >= ?');
      params.push(parseInt(capacity));
    }

    // Filtrar por disponibilidad de fechas (habitaciones no reservadas en esas fechas)
    // Una habitación no está disponible si hay una reserva que se solapa con el rango de búsqueda
    // Solapamiento: reserva.checkOut > checkIn AND reserva.checkIn < checkOut
    if (checkIn && checkOut) {
      conditions.push(`
        r.id_room NOT IN (
          SELECT res.id_room FROM reservation res
          WHERE res.check_out_date > ? AND res.check_in_date < ?
        )
      `);
      params.push(checkIn, checkOut);
    }

    // Solo habitaciones disponibles
    conditions.push("r.status = 'available'");

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Contar total
    const countSql = sql.replace('SELECT r.*, h.name as hotel_name, h.address as hotel_address, h.city as hotel_city', 'SELECT COUNT(*) as total');
    const [[{ total }]] = await db.query(countSql, params);

    // Obtener resultados paginados
    sql += ' ORDER BY r.price_per_night ASC LIMIT ? OFFSET ?';
    const [rows] = await db.query(sql, [...params, limitNum, offset]);

    return res.status(200).json({
      data: rows,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('searchRooms error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { searchRooms };
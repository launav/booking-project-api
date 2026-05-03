const db = require('../config/db');

/**
 * GET /api/rooms/search?city=&checkIn=&checkOut=&capacity=&page=1&limit=10
 */
const searchRooms = async (req, res) => {
  const { city, checkIn, checkOut, capacity, page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  try {
    let sql = `
      FROM room r
      JOIN hotel h ON r.id_hotel = h.id_hotel
    `;

    const params = [];
    const conditions = [];

    // ciudad
    if (city) {
      params.push(`%${city}%`);
      conditions.push(`LOWER(h.city) LIKE LOWER($${params.length})`);
    }

    // capacidad
    if (capacity) {
      params.push(parseInt(capacity));
      conditions.push(`r.capacity >= $${params.length}`);
    }

    // disponibilidad (no solapamiento)
    if (checkIn && checkOut) {
      params.push(checkIn, checkOut);
      const p1 = params.length - 1; // checkIn
      const p2 = params.length;     // checkOut

      conditions.push(`
        r.id_room NOT IN (
          SELECT res.id_room FROM reservation res
          WHERE res.check_out_date > $${p1}
            AND res.check_in_date < $${p2}
            AND res.reservation_status != 'cancelled'
        )
      `);
    }

    // estado
    conditions.push(`r.status = 'available'`);

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // total
    const countQuery = `SELECT COUNT(*)::int AS total ${sql}`;
    const countResult = await db.query(countQuery, params);
    const total = countResult.rows[0].total;

    // datos
    const dataQuery = `
      SELECT r.*, 
             h.name AS hotel_name, 
             h.address AS hotel_address, 
             h.city AS hotel_city
      ${sql}
      ORDER BY r.price_per_night ASC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    const dataResult = await db.query(
      dataQuery,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      data: dataResult.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });

  } catch (err) {
    console.error('searchRooms error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { searchRooms };
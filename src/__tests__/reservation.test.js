process.env.JWT_SECRET     = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

jest.mock('../config/db', () => ({ query: jest.fn() }));
const db      = require('../config/db');
const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../app');

const adminToken  = jwt.sign({ id_user: 1, email: 'admin@test.com', role: 'admin' },  'test-secret');
const clientToken = jwt.sign({ id_user: 2, email: 'client@test.com', role: 'client' }, 'test-secret');

const fakeReservation = {
  id_reservation: 1, id_user: 2, id_room: 1, id_hotel: 1,
  check_in_date: '2025-06-01', check_out_date: '2025-06-07',
  reservation_status: 'pending',
  first_name: 'Laura', last_name: 'García', email: 'client@test.com',
  room_number: '101', type: 'doble', hotel_name: 'Hotel Sol',
};

describe('GET /api/reservations', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin obtiene lista paginada', async () => {
    db.query
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[fakeReservation]]);

    const res = await request(app)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  test('403 - cliente no puede listar todas las reservas', async () => {
    const res = await request(app)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('401 - sin token', async () => {
    const res = await request(app).get('/api/reservations');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/reservations/my', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - cliente obtiene sus reservas', async () => {
    db.query.mockResolvedValueOnce([[fakeReservation]]);
    const res = await request(app)
      .get('/api/reservations/my')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/reservations/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin obtiene cualquier reserva', async () => {
    db.query.mockResolvedValueOnce([[fakeReservation]]);
    const res = await request(app)
      .get('/api/reservations/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('200 - cliente obtiene su propia reserva', async () => {
    db.query.mockResolvedValueOnce([[{ ...fakeReservation, id_user: 2 }]]);
    const res = await request(app)
      .get('/api/reservations/1')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('403 - cliente no puede ver reserva ajena', async () => {
    db.query.mockResolvedValueOnce([[{ ...fakeReservation, id_user: 99 }]]);
    const res = await request(app)
      .get('/api/reservations/1')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('404 - reserva no encontrada', async () => {
    db.query.mockResolvedValueOnce([[]]);
    const res = await request(app)
      .get('/api/reservations/999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/reservations', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 - cliente crea reserva', async () => {
    db.query
      .mockResolvedValueOnce([[]])                  // sin conflictos
      .mockResolvedValueOnce([{ insertId: 5 }]);    // insert ok

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ id_room: 1, id_hotel: 1, check_in_date: '2025-08-01', check_out_date: '2025-08-05' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_reservation');
  });

  test('400 - fechas inválidas (check_in >= check_out)', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ id_room: 1, id_hotel: 1, check_in_date: '2025-08-05', check_out_date: '2025-08-01' });
    expect(res.statusCode).toBe(400);
  });

  test('400 - faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ id_room: 1 });
    expect(res.statusCode).toBe(400);
  });

  test('409 - habitación no disponible en esas fechas', async () => {
    db.query.mockResolvedValueOnce([[{ id_reservation: 3 }]]); // conflicto

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ id_room: 1, id_hotel: 1, check_in_date: '2025-08-01', check_out_date: '2025-08-05' });

    expect(res.statusCode).toBe(409);
  });
});

describe('PATCH /api/reservations/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin actualiza estado', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .patch('/api/reservations/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });
    expect(res.statusCode).toBe(200);
  });

  test('400 - estado inválido', async () => {
    const res = await request(app)
      .patch('/api/reservations/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid_status' });
    expect(res.statusCode).toBe(400);
  });

  test('403 - cliente no puede cambiar estado', async () => {
    const res = await request(app)
      .patch('/api/reservations/1/status')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'confirmed' });
    expect(res.statusCode).toBe(403);
  });
});

describe('DELETE /api/reservations/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - cliente cancela su propia reserva', async () => {
    db.query
      .mockResolvedValueOnce([[{ ...fakeReservation, id_user: 2 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .delete('/api/reservations/1')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('403 - cliente no puede cancelar reserva ajena', async () => {
    db.query.mockResolvedValueOnce([[{ ...fakeReservation, id_user: 99 }]]);

    const res = await request(app)
      .delete('/api/reservations/1')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('404 - reserva no encontrada', async () => {
    db.query.mockResolvedValueOnce([[]]);
    const res = await request(app)
      .delete('/api/reservations/999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});

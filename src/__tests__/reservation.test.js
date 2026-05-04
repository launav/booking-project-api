process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

jest.mock('../config/db', () => ({ query: jest.fn() }));
const db = require('../config/db');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

const adminToken = jwt.sign({ id_user: 1, email: 'admin@test.com', role: 'admin' }, 'test-secret');
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
    // PostgreSQL usa { rows: [...] }
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 1 }] }) // COUNT
      .mockResolvedValueOnce({ rows: [fakeReservation] }); // SELECT

    const res = await request(app)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total', 1);
  });

  test('403 - cliente no puede listar', async () => {
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
    db.query.mockResolvedValueOnce({ rows: [fakeReservation] });

    const res = await request(app)
      .get('/api/reservations/my')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('401 - sin token', async () => {
    const res = await request(app).get('/api/reservations/my');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/reservations/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin ve cualquier reserva', async () => {
    db.query.mockResolvedValueOnce({ rows: [fakeReservation] });

    const res = await request(app)
      .get('/api/reservations/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id_reservation', 1);
  });

  test('200 - cliente ve su propia reserva', async () => {
    // La reserva pertenece al cliente (id_user: 2)
    db.query.mockResolvedValueOnce({ rows: [fakeReservation] });

    const res = await request(app)
      .get('/api/reservations/1')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id_user', 2);
  });

  test('403 - cliente no puede ver reserva de otro usuario', async () => {
    // La reserva pertenece a otro usuario (id_user: 99)
    db.query.mockResolvedValueOnce({ rows: [{ ...fakeReservation, id_user: 99 }] });

    const res = await request(app)
      .get('/api/reservations/1')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('404 - reserva no existe', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/reservations/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('401 - sin token', async () => {
    const res = await request(app).get('/api/reservations/1');
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/reservations', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 - crea reserva exitosamente', async () => {
    // Primera query: verificar disponibilidad (sin conflictos)
    db.query.mockResolvedValueOnce({ rows: [] }); // No hay reservas conflictivas
    // Segunda query: INSERT con RETURNING
    db.query.mockResolvedValueOnce({ rows: [{ id_reservation: 5 }] });

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ 
        id_room: 1, 
        id_hotel: 1, 
        check_in_date: '2025-08-01', 
        check_out_date: '2025-08-05' 
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_reservation', 5);
    expect(res.body).toHaveProperty('message', 'Reserva creada');
  });

  test('400 - faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ id_room: 1 }); // Faltan id_hotel y fechas

    expect(res.statusCode).toBe(400);
  });

  test('400 - fechas inválidas (check_in >= check_out)', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ 
        id_room: 1, 
        id_hotel: 1, 
        check_in_date: '2025-08-05', 
        check_out_date: '2025-08-01' 
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('fecha de entrada debe ser anterior');
  });

  test('409 - conflicto de fechas (habitación no disponible)', async () => {
    // Simular que ya existe una reserva en esas fechas
    db.query.mockResolvedValueOnce({ rows: [{ id_reservation: 1 }] });

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ 
        id_room: 1, 
        id_hotel: 1, 
        check_in_date: '2025-08-01', 
        check_out_date: '2025-08-05' 
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toContain('habitación no está disponible');
  });

  test('401 - sin token', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({ 
        id_room: 1, 
        id_hotel: 1, 
        check_in_date: '2025-08-01', 
        check_out_date: '2025-08-05' 
      });

    expect(res.statusCode).toBe(401);
  });
});

describe('PATCH /api/reservations/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin actualiza estado', async () => {
    // PostgreSQL usa rowCount
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .patch('/api/reservations/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Estado de reserva actualizado');
  });

  test('400 - estado inválido', async () => {
    const res = await request(app)
      .patch('/api/reservations/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid_status' });

    expect(res.statusCode).toBe(400);
  });

  test('404 - reserva no encontrada', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .patch('/api/reservations/999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });

    expect(res.statusCode).toBe(404);
  });

  test('403 - cliente no puede actualizar estado', async () => {
    const res = await request(app)
      .patch('/api/reservations/1/status')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'confirmed' });

    expect(res.statusCode).toBe(403);
  });

  test('401 - sin token', async () => {
    const res = await request(app)
      .patch('/api/reservations/1/status')
      .send({ status: 'confirmed' });

    expect(res.statusCode).toBe(401);
  });
});

describe('DELETE /api/reservations/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - cliente cancela su propia reserva', async () => {
    // Primera query: verificar que la reserva existe y pertenece al cliente
    db.query.mockResolvedValueOnce({ rows: [fakeReservation] }); // SELECT
    // Segunda query: actualizar estado a 'cancelled'
    db.query.mockResolvedValueOnce({ rowCount: 1 }); // UPDATE

    const res = await request(app)
      .delete('/api/reservations/1')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Reserva cancelada');
  });

  test('200 - admin cancela cualquier reserva', async () => {
    // Admin puede cancelar reservas de otros usuarios
    db.query.mockResolvedValueOnce({ rows: [fakeReservation] }); // SELECT
    db.query.mockResolvedValueOnce({ rowCount: 1 }); // UPDATE

    const res = await request(app)
      .delete('/api/reservations/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('403 - cliente intenta cancelar reserva de otro usuario', async () => {
    // La reserva pertenece a otro usuario (id_user: 99)
    db.query.mockResolvedValueOnce({ rows: [{ ...fakeReservation, id_user: 99 }] });

    const res = await request(app)
      .delete('/api/reservations/1')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('404 - reserva no existe', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/reservations/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('401 - sin token', async () => {
    const res = await request(app).delete('/api/reservations/1');
    expect(res.statusCode).toBe(401);
  });
});
// Configuración inicial (solo una vez)
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

// Mock de la base de datos antes de importar otros módulos
jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

const adminToken = jwt.sign({ id_user: 1, email: 'admin@test.com', role: 'admin' }, 'test-secret');
const clientToken = jwt.sign({ id_user: 2, email: 'client@test.com', role: 'client' }, 'test-secret');

const fakeHotel = { id_hotel: 1, name: 'Hotel Sol', address: 'Gran Vía 1', city: 'Madrid' };

describe('GET /api/hotels', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - devuelve lista paginada', async () => {
    // PostgreSQL devuelve { rows: [...] }
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 1 }] }) // COUNT
      .mockResolvedValueOnce({ rows: [fakeHotel] });   // SELECT

    const res = await request(app).get('/api/hotels');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total', 1);
  });
});

describe('GET /api/hotels/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - hotel encontrado', async () => {
    db.query.mockResolvedValueOnce({ rows: [fakeHotel] });

    const res = await request(app).get('/api/hotels/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Hotel Sol');
  });

  test('404 - hotel no encontrado', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/hotels/999');

    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/hotels', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 - admin crea hotel', async () => {
    // PostgreSQL con RETURNING devuelve { rows: [...] }
    db.query.mockResolvedValueOnce({ rows: [{ id_hotel: 2 }] });

    const res = await request(app)
      .post('/api/hotels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Hotel Luna', address: 'Calle Luna 5', city: 'Barcelona' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_hotel', 2);
  });

  test('400 - faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/hotels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Hotel Luna' });

    expect(res.statusCode).toBe(400);
  });

  test('401 - sin token', async () => {
    const res = await request(app)
      .post('/api/hotels')
      .send({ name: 'Hotel Luna', address: 'Calle Luna 5', city: 'Barcelona' });

    expect(res.statusCode).toBe(401);
  });

  test('403 - cliente no puede crear hotel', async () => {
    const res = await request(app)
      .post('/api/hotels')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Hotel Luna', address: 'Calle Luna 5', city: 'Barcelona' });

    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/hotels/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin actualiza hotel', async () => {
    // PostgreSQL usa rowCount en lugar de affectedRows
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .put('/api/hotels/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Hotel Sol Actualizado', address: 'Gran Vía 2', city: 'Madrid' });

    expect(res.statusCode).toBe(200);
  });

  test('404 - hotel no encontrado', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .put('/api/hotels/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X', address: 'X', city: 'X' });

    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/hotels/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin elimina hotel', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete('/api/hotels/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('404 - hotel no encontrado', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete('/api/hotels/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('409 - error por reservas asociadas', async () => {
    // Error de foreign key en PostgreSQL
    const pgError = new Error('Foreign key violation');
    pgError.code = '23503'; // Código de PostgreSQL para foreign_key_violation
    db.query.mockRejectedValueOnce(pgError);

    const res = await request(app)
      .delete('/api/hotels/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(409);
  });
});
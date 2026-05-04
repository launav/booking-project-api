process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

const adminToken = jwt.sign(
  { id_user: 1, email: 'admin@test.com', role: 'admin' },
  'test-secret'
);

const clientToken = jwt.sign(
  { id_user: 2, email: 'client@test.com', role: 'client' },
  'test-secret'
);

const fakeUser = {
  id_user: 2,
  first_name: 'Laura',
  last_name: 'Navarro',
  email: 'client@test.com',
  role: 'client',
  phone: '600000000',
  address: 'Calle Mayor 1',
};

describe('GET /api/users', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin obtiene lista paginada', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 1 }] }) // COUNT
      .mockResolvedValueOnce({ rows: [fakeUser] });    // DATA

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  test('403 - cliente no puede listar usuarios', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('401 - sin token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/users/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin ve cualquier usuario', async () => {
    db.query.mockResolvedValueOnce({ rows: [fakeUser] });

    const res = await request(app)
      .get('/api/users/2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id_user', 2);
  });

  test('200 - cliente ve su propio perfil', async () => {
    db.query.mockResolvedValueOnce({ rows: [fakeUser] });

    const res = await request(app)
      .get('/api/users/2')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('403 - cliente no puede ver otro usuario', async () => {
    // El cliente con token (id_user: 2) intenta ver el usuario 99
    const res = await request(app)
      .get('/api/users/99')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('404 - usuario no existe', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/users/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/users/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - usuario actualiza su propio perfil', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        first_name: 'Laura',
        last_name: 'García',
        phone: '611111111',
        address: 'Nueva Calle 1'
      });

    expect(res.statusCode).toBe(200);
  });

  test('403 - cliente no puede actualizar otro usuario', async () => {
    const res = await request(app)
      .put('/api/users/99')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ first_name: 'Otro' });

    expect(res.statusCode).toBe(403);
  });

  test('404 - usuario no existe', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .put('/api/users/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ first_name: 'X' });

    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/users/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin elimina usuario', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete('/api/users/2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('403 - cliente no puede eliminar usuarios', async () => {
    const res = await request(app)
      .delete('/api/users/2')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('404 - usuario no existe', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete('/api/users/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});
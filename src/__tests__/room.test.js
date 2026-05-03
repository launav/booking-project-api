process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

jest.mock('../config/db', () => ({ query: jest.fn() }));
const db = require('../config/db');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

const adminToken = jwt.sign({ id_user: 1, email: 'admin@test.com', role: 'admin' }, 'test-secret');
const clientToken = jwt.sign({ id_user: 2, email: 'client@test.com', role: 'client' }, 'test-secret');

const fakeRoom = {
  id_room: 1, id_hotel: 1, room_number: '101',
  type: 'doble', capacity: 2, price_per_night: 120, status: 'available',
};

describe('GET /api/rooms', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - devuelve lista paginada', async () => {
    db.query
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[fakeRoom]]);

    const res = await request(app).get('/api/rooms');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  test('200 - filtra por hotel_id', async () => {
    db.query
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[fakeRoom]]);

    const res = await request(app).get('/api/rooms?hotel_id=1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data[0]).toHaveProperty('id_hotel', 1);
  });
});

describe('GET /api/rooms/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - habitación encontrada', async () => {
    db.query.mockResolvedValueOnce([[fakeRoom]]);
    const res = await request(app).get('/api/rooms/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('room_number', '101');
  });

  test('404 - habitación no encontrada', async () => {
    db.query.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/rooms/999');
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/rooms', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 - admin crea habitación', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 2 }]);
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id_hotel: 1, room_number: '102', type: 'individual', capacity: 1, price_per_night: 80 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_room');
  });

  test('400 - faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id_hotel: 1, room_number: '102' });
    expect(res.statusCode).toBe(400);
  });

  test('401 - sin token', async () => {
    const res = await request(app).post('/api/rooms').send({});
    expect(res.statusCode).toBe(401);
  });

  test('403 - cliente no puede crear habitación', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ id_hotel: 1, room_number: '102', type: 'individual', capacity: 1, price_per_night: 80 });
    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/rooms/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin actualiza habitación', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .put('/api/rooms/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ room_number: '101', type: 'suite', capacity: 2, price_per_night: 200, status: 'available' });
    expect(res.statusCode).toBe(200);
  });

  test('404 - habitación no encontrada', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app)
      .put('/api/rooms/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ room_number: 'X', type: 'X', capacity: 1, price_per_night: 1, status: 'available' });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/rooms/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin elimina habitación', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .delete('/api/rooms/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('404 - habitación no encontrada', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app)
      .delete('/api/rooms/999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});

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
  id_room: 1,
  id_hotel: 1,
  room_number: '101',
  type: 'doble',
  capacity: 2,
  price_per_night: 120,
  description: 'Habitación con vistas',
  status: 'available'
};

describe('GET /api/rooms', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - devuelve lista paginada', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [fakeRoom] });

    const res = await request(app).get('/api/rooms');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });
});

describe('GET /api/rooms/search', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - devuelve resultados filtrados por capacidad', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ ...fakeRoom, hotel_name: 'Hotel Sol', hotel_city: 'Madrid' }] });

    const res = await request(app).get('/api/rooms/search?capacity=2');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  test('200 - devuelve resultados filtrados por ciudad y fechas', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ ...fakeRoom, hotel_name: 'Hotel Sol', hotel_city: 'Madrid' }] });

    const res = await request(app)
      .get('/api/rooms/search?city=Madrid&checkIn=2025-08-01&checkOut=2025-08-05');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  test('200 - devuelve lista vacía si no hay resultados', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/rooms/search?capacity=10');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/rooms/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - habitación encontrada', async () => {
    db.query.mockResolvedValueOnce({ rows: [fakeRoom] });

    const res = await request(app).get('/api/rooms/1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id_room', 1);
  });

  test('404 - habitación no encontrada', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/rooms/999');
    
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/rooms', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 - admin crea habitación', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id_room: 3 }] });

    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        id_hotel: 1, 
        room_number: '102', 
        type: 'individual', 
        capacity: 1, 
        price_per_night: 80 
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_room', 3);
  });

  test('403 - cliente no puede crear habitación', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ 
        id_hotel: 1, 
        room_number: '102', 
        type: 'individual', 
        capacity: 1, 
        price_per_night: 80 
      });

    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/rooms/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin actualiza habitación', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .put('/api/rooms/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        room_number: '101A', 
        type: 'doble superior', 
        capacity: 2, 
        price_per_night: 150, 
        status: 'available' 
      });

    expect(res.statusCode).toBe(200);
  });

  test('404 - habitación no encontrada', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .put('/api/rooms/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        room_number: 'X', 
        type: 'X', 
        capacity: 1, 
        price_per_night: 1, 
        status: 'available' 
      });

    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/rooms/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - admin elimina habitación', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete('/api/rooms/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('404 - habitación no encontrada', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete('/api/rooms/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});
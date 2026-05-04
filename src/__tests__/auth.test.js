process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '24h';

jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('201 - registro correcto', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id_user: 1 }] });

    const res = await request(app).post('/api/auth/register').send({
      first_name: 'Laura',
      last_name: 'García',
      email: 'laura@test.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_user', 1);
  });

  test('400 - faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'laura@test.com',
    });

    expect(res.statusCode).toBe(400);
  });

  test('409 - email ya registrado', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id_user: 1 }] });

    const res = await request(app).post('/api/auth/register').send({
      first_name: 'Laura',
      last_name: 'García',
      email: 'laura@test.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('200 - login correcto devuelve token', async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    db.query.mockResolvedValueOnce({ rows: [{
      id_user: 1,
      email: 'laura@test.com',
      role: 'client',
      password: hashedPassword,
      is_verified: true
    }] });

    const res = await request(app).post('/api/auth/login').send({
      email: 'laura@test.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('400 - faltan email o contraseña', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'laura@test.com',
    });

    expect(res.statusCode).toBe(400);
  });

  test('401 - usuario no encontrado', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(401);
  });

  test('401 - contraseña incorrecta', async () => {
    const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
    
    db.query.mockResolvedValueOnce({ rows: [{
      id_user: 1,
      email: 'laura@test.com',
      role: 'client',
      password: hashedPassword,
      is_verified: true
    }] });

    const res = await request(app).post('/api/auth/login').send({
      email: 'laura@test.com',
      password: 'WrongPassword123!',
    });

    expect(res.statusCode).toBe(401);
  });
});
process.env.JWT_SECRET      = 'test-secret';
process.env.JWT_EXPIRES_IN  = '1h';

jest.mock('../config/db', () => ({ query: jest.fn() }));
const db      = require('../config/db');
const request = require('supertest');
const app     = require('../app');
const bcrypt  = require('bcrypt');

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 - registro correcto', async () => {
    db.query
      .mockResolvedValueOnce([[]])                         // email no existe
      .mockResolvedValueOnce([{ insertId: 1 }]);           // insert ok

    const res = await request(app).post('/api/auth/register').send({
      first_name: 'Laura',
      last_name:  'García',
      email:      'laura@test.com',
      password:   'password123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_user');
  });

  test('400 - faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'laura@test.com',
    });
    expect(res.statusCode).toBe(400);
  });

  test('409 - email ya registrado', async () => {
    db.query.mockResolvedValueOnce([[{ id_user: 1 }]]);    // email ya existe

    const res = await request(app).post('/api/auth/register').send({
      first_name: 'Laura',
      last_name:  'García',
      email:      'laura@test.com',
      password:   'password123',
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - login correcto devuelve token', async () => {
    const hash = await bcrypt.hash('password123', 10);
    db.query.mockResolvedValueOnce([[{
      id_user: 1, first_name: 'Laura', last_name: 'García',
      email: 'laura@test.com', role: 'client', password: hash,
    }]]);

    const res = await request(app).post('/api/auth/login').send({
      email:    'laura@test.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'laura@test.com');
  });

  test('400 - faltan email o contraseña', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'laura@test.com' });
    expect(res.statusCode).toBe(400);
  });

  test('401 - usuario no encontrado', async () => {
    db.query.mockResolvedValueOnce([[]]); // sin resultados
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com', password: 'pass',
    });
    expect(res.statusCode).toBe(401);
  });

  test('401 - contraseña incorrecta', async () => {
    const hash = await bcrypt.hash('otraPassword', 10);
    db.query.mockResolvedValueOnce([[{
      id_user: 1, email: 'laura@test.com', role: 'client', password: hash,
    }]]);

    const res = await request(app).post('/api/auth/login').send({
      email: 'laura@test.com', password: 'password123',
    });
    expect(res.statusCode).toBe(401);
  });
});

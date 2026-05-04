require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// Cors
const allowedOrigins = [
  'http://localhost:4200',
  'https://booking-project-taupe.vercel.app'
];

// Middlewares globales
app.use(cors({
  origin: (origin, callback) => {
    // Permitir herramientas como Postman o requests sin origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir imágenes estáticas desde /uploads
// El frontend las accede como: http://localhost:3000/uploads/hoteles/imagen.jpg
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rutas de la API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/hotels', require('./routes/hotel.routes'));
app.use('/api/rooms', require('./routes/room.routes'));
app.use('/api/images', require('./routes/image.routes'));
app.use('/api/reservations', require('./routes/reservation.routes'));
app.use('/api/users', require('./routes/user.routes'));

// Documentación Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ruta de comprobación
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Roomify API funcionando correctamente' });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor arrancado en http://localhost:${PORT}`);
});

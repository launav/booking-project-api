require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middlewares globales ───────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Servir imágenes estáticas desde /uploads ──────────────────
// El frontend las accede como: http://localhost:3000/uploads/hoteles/imagen.jpg
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Rutas de la API ───────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/hotels',       require('./routes/hotel.routes'));
app.use('/api/rooms',        require('./routes/room.routes'));
app.use('/api/images',       require('./routes/image.routes'));
app.use('/api/reservations', require('./routes/reservation.routes'));
app.use('/api/users',        require('./routes/user.routes'));

// ── Ruta de comprobación ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Roomify API funcionando correctamente' });
});

// ── Ruta no encontrada ────aa────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// ── Arrancar servidor ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor arrancado en http://localhost:${PORT}`);
});

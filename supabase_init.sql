-- ============================================================
--  ROOMIFY — Script de inicialización para Supabase / PostgreSQL
--  Ejecuta este script en el SQL Editor de Supabase o en psql
-- ============================================================


-- 0. Limpieza (para re-ejecución segura)
DROP TABLE IF EXISTS image        CASCADE;
DROP TABLE IF EXISTS reservation  CASCADE;
DROP TABLE IF EXISTS room         CASCADE;
DROP TABLE IF EXISTS hotel        CASCADE;
DROP TABLE IF EXISTS "user"       CASCADE;


-- 1. Tabla "user"
--  NOTA: "user" va entre comillas porque es palabra reservada en PostgreSQL.
CREATE TABLE "user" (
  id_user     SERIAL PRIMARY KEY,
  first_name  VARCHAR(100)  NOT NULL,
  last_name   VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  UNIQUE NOT NULL,
  password    VARCHAR(255)  NOT NULL,
  role        VARCHAR(20)   NOT NULL DEFAULT 'user'
                            CHECK (role IN ('user', 'admin')),
  phone       VARCHAR(20),
  address     TEXT,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);


-- 2. Tabla hotel
CREATE TABLE hotel (
  id_hotel    SERIAL PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  address     TEXT          NOT NULL,
  city        VARCHAR(100)  NOT NULL,
  phone       VARCHAR(20),
  email       VARCHAR(255),
  description TEXT,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);


--  3. Tabla room
CREATE TABLE room (
  id_room          SERIAL PRIMARY KEY,
  id_hotel         INTEGER        NOT NULL REFERENCES hotel(id_hotel) ON DELETE CASCADE,
  room_number      VARCHAR(10)    NOT NULL,
  type             VARCHAR(50)    NOT NULL,
  capacity         INTEGER        NOT NULL CHECK (capacity > 0),
  price_per_night  NUMERIC(10,2)  NOT NULL CHECK (price_per_night > 0),
  description      TEXT,
  status           VARCHAR(20)    NOT NULL DEFAULT 'available'
                                  CHECK (status IN ('available', 'unavailable', 'maintenance')),
  created_at       TIMESTAMPTZ    DEFAULT NOW()
);


--  4. Tabla reservation 
CREATE TABLE reservation (
  id_reservation      SERIAL PRIMARY KEY,
  id_user             INTEGER      NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  id_room             INTEGER      NOT NULL REFERENCES room(id_room)   ON DELETE CASCADE,
  id_hotel            INTEGER      NOT NULL REFERENCES hotel(id_hotel) ON DELETE CASCADE,
  check_in_date       DATE         NOT NULL,
  check_out_date      DATE         NOT NULL,
  reservation_status  VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                   CHECK (reservation_status IN ('pending', 'confirmed', 'cancelled')),
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_dates CHECK (check_out_date > check_in_date)
);


--  5. Tabla image 
CREATE TABLE image (
  id_image   SERIAL PRIMARY KEY,
  id_hotel   INTEGER  REFERENCES hotel(id_hotel) ON DELETE CASCADE,
  id_room    INTEGER  REFERENCES room(id_room)   ON DELETE CASCADE,
  url        TEXT     NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


--  Índices 
CREATE INDEX idx_room_hotel        ON room(id_hotel);
CREATE INDEX idx_reservation_user  ON reservation(id_user);
CREATE INDEX idx_reservation_room  ON reservation(id_room);
CREATE INDEX idx_reservation_dates ON reservation(check_in_date, check_out_date);
CREATE INDEX idx_image_hotel       ON image(id_hotel);
CREATE INDEX idx_image_room        ON image(id_room);


-- ============================================================
--  DATOS DE PRUEBA
-- ============================================================

--  Usuario admin 
--  Contraseña por defecto: Admin1234!
--  Genera el hash ANTES de insertar con:
--    node -e "const b=require('bcrypt'); b.hash('Admin1234!',10).then(h=>console.log(h))"
--  Luego sustituye el valor de password abajo.
INSERT INTO "user" (first_name, last_name, email, password, role) VALUES
('Admin', 'Roomify', 'admin@roomify.com',
 '$2b$10$SUSTITUYE_ESTE_VALOR_POR_EL_HASH_GENERADO', 'admin');

--  Hoteles 
INSERT INTO hotel (name, address, city, phone, email, description) VALUES
('Hotel Gran Vía',
 'Gran Vía 45', 'Madrid',
 '+34 910 000 001', 'granvia@roomify.com',
 'Hotel de lujo en el corazón de Madrid, a pasos de los principales museos y teatros.'),

('Hotel Barceloneta',
 'Passeig Marítim 120', 'Barcelona',
 '+34 932 000 001', 'barceloneta@roomify.com',
 'Frente al mar, diseño moderno y acceso directo a la playa Barceloneta.'),

('Hotel Valencia Sol',
 'Av. del Port 30', 'Valencia',
 '+34 963 000 001', 'valenciasol@roomify.com',
 'A 5 minutos del Puerto de Valencia, ideal para descubrir la Comunidad Valenciana.');


--  Habitaciones — Hotel Gran Vía (id_hotel = 1) ─
INSERT INTO room (id_hotel, room_number, type, capacity, price_per_night, description, status) VALUES
(1, '101', 'individual', 1,  79.00,
 'Habitación individual con vistas al interior, cama de 90 cm y baño privado.', 'available'),

(1, '102', 'doble',      2, 115.00,
 'Habitación doble con cama de matrimonio y vistas a Gran Vía.', 'available'),

(1, '201', 'doble',      2, 125.00,
 'Habitación doble superior con sofá-cama y balcón privado.', 'available'),

(1, '301', 'suite',      2, 220.00,
 'Suite junior con salón independiente, bañera de hidromasaje y vistas panorámicas.', 'available'),

(1, '401', 'familiar',   4, 180.00,
 'Habitación familiar con dos camas dobles, ideal para grupos de hasta 4 personas.', 'available');


--  Habitaciones — Hotel Barceloneta (id_hotel = 2) 
INSERT INTO room (id_hotel, room_number, type, capacity, price_per_night, description, status) VALUES
(2, '101', 'individual', 1,  89.00,
 'Habitación individual con vistas al jardín y acceso a la terraza común.', 'available'),

(2, '102', 'doble',      2, 135.00,
 'Doble con vista al mar, cama king size y terraza privada.', 'available'),

(2, '201', 'suite',      2, 280.00,
 'Suite con jacuzzi exterior y vistas panorámicas al Mediterráneo.', 'available'),

(2, '301', 'familiar',   4, 210.00,
 'Habitación familiar de 40 m² con litera y cama doble, zona de desayuno incluida.', 'available'),

(2, '302', 'doble',      2, 140.00,
 'Doble estándar con terraza y vista parcial al mar.', 'available');


--  Habitaciones — Hotel Valencia Sol (id_hotel = 3) ─
INSERT INTO room (id_hotel, room_number, type, capacity, price_per_night, description, status) VALUES
(3, '101', 'individual', 1,  65.00,
 'Individual económica, perfecta para viajes de trabajo.', 'available'),

(3, '102', 'doble',      2,  95.00,
 'Doble estándar con cama de matrimonio y escritorio.', 'available'),

(3, '201', 'doble',      2, 110.00,
 'Doble superior con balcón y vistas al puerto.', 'available'),

(3, '301', 'suite',      3, 190.00,
 'Suite con sala de estar y vistas al Mediterráneo.', 'available'),

(3, '401', 'familiar',   4, 160.00,
 'Habitación familiar amplia con cuna disponible bajo petición.', 'available');


--  Imágenes de hoteles 
--  Sustituye estas URLs por las tuyas propias en producción.
INSERT INTO image (id_hotel, id_room, url) VALUES
(1, NULL, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'),
(1, NULL, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200'),
(2, NULL, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200'),
(2, NULL, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200'),
(3, NULL, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200'),
(3, NULL, 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200');


-- ============================================================
--  VERIFICACIÓN
-- ============================================================
SELECT 'user'        AS tabla, COUNT(*) FROM "user"
UNION ALL
SELECT 'hotel',               COUNT(*) FROM hotel
UNION ALL
SELECT 'room',                COUNT(*) FROM room
UNION ALL
SELECT 'reservation',         COUNT(*) FROM reservation
UNION ALL
SELECT 'image',               COUNT(*) FROM image;

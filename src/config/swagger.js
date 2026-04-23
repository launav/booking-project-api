const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Roomify API',
            version: '1.0.0',
            description: 'API REST para gestión de reservas hoteleras',
        },
        servers: [{ url: 'http://localhost:3000' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id_user: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Laura García' },
                        email: { type: 'string', example: 'laura@email.com' },
                        role: { type: 'string', enum: ['client', 'admin'], example: 'client' },
                        phone: { type: 'string', example: '600000000' },
                        address: { type: 'string', example: 'Calle Mayor 1, Madrid' },
                    },
                },
                Hotel: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Hotel Sol' },
                        address: { type: 'string', example: 'Calle Gran Vía 10' },
                        city: { type: 'string', example: 'Madrid' },
                        phone: { type: 'string', example: '912345678' },
                        email: { type: 'string', example: 'info@hotelsol.com' },
                        description: { type: 'string', example: 'Hotel de 4 estrellas en el centro' },
                    },
                },
                Room: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        hotel_id: { type: 'integer', example: 1 },
                        room_number: { type: 'string', example: '101' },
                        type: { type: 'string', example: 'doble' },
                        capacity: { type: 'integer', example: 2 },
                        price: { type: 'number', example: 120.50 },
                        description: { type: 'string', example: 'Habitación con vistas al mar' },
                        status: { type: 'string', enum: ['available', 'occupied', 'maintenance'], example: 'available' },
                    },
                },
                Reservation: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        user_id: { type: 'integer', example: 2 },
                        room_id: { type: 'integer', example: 3 },
                        hotel_id: { type: 'integer', example: 1 },
                        check_in_date: { type: 'string', format: 'date', example: '2025-06-01' },
                        check_out_date: { type: 'string', format: 'date', example: '2025-06-07' },
                        status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'], example: 'pending' },
                    },
                },
                Image: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        hotel_id: { type: 'integer', example: 1, nullable: true },
                        room_id: { type: 'integer', example: null, nullable: true },
                        image_path: { type: 'string', example: 'uploads/hoteles/hotel_1234_foto.jpg' },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        total: { type: 'integer', example: 45 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 5 },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Recurso no encontrado' },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);

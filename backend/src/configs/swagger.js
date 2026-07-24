import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Digital Caregiver API Documentation',
            version: '1.0.0',
            description: 'Tài liệu API chi tiết cho hệ thống Chăm sóc sức khỏe người cao tuổi (Digital Caregiver).',
            contact: {
                name: 'Digital Caregiver Dev Team',
                email: 'support@digitalcaregiver.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Nhập JWT token được cấp sau khi xác thực thành công (Ví dụ: Bearer <your_jwt_token>)',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('📄 Swagger API docs available at http://localhost:3001/api-docs');
};

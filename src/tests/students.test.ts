import request from 'supertest';
import express from 'express';
import { studentRoutes } from '../routes/students';
import { pool } from '../config/database';

// Création d'un mock pour la méthode `query`
jest.mock('../config/database', () => ({
    pool: {
        query: jest.fn(),
    },
}));

const app = express();
app.use(express.json());
app.use('/students', studentRoutes);

describe('Student API tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch all students', async () => {
        const mockStudents = [
            {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                dateOfBirth: '2000-01-01',
                studentId: 'S1234',
            },
        ];

        // Moquer la méthode query pour renvoyer un résultat simulé
        (pool.query as jest.Mock).mockResolvedValue({ rows: mockStudents });

        const response = await request(app).get('/students');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockStudents);
        expect(pool.query).toHaveBeenCalledWith(
            'SELECT id, first_name as "firstName", last_name as "lastName", email, date_of_birth as "dateOfBirth", student_id as "studentId" FROM students'
        );
    });

    it('should fetch a student by ID', async () => {
        const mockStudent = {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            dateOfBirth: '2000-01-01',
            studentId: 'S1234',
        };

        (pool.query as jest.Mock).mockResolvedValue({ rows: [mockStudent] });

        const response = await request(app).get('/students/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockStudent);
        expect(pool.query).toHaveBeenCalledWith(
            'SELECT id, first_name as "firstName", last_name as "lastName", email, date_of_birth as "dateOfBirth", student_id as "studentId" FROM students WHERE id = $1',
            ['1']
        );
    });

    it('should return 404 if student not found by ID', async () => {
        (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

        const response = await request(app).get('/students/999');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Étudiant non trouvé' });
    });

    it('should return 400 if the student creation data is invalid', async () => {
        const invalidStudentData = {
            firstName: 'Jane',
            email: 'jane.smith@example.com', // Missing lastName and other required fields
        };

        const response = await request(app)
            .post('/students')
            .send(invalidStudentData)
            .set('Authorization', 'Bearer validToken');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Données invalides',
            details: [
                { field: 'lastName', message: 'Required' },
                { field: 'dateOfBirth', message: 'Required' },
                { field: 'studentId', message: 'Required' },
            ],
        });
    });

    it('should create a new student', async () => {
        const newStudent = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            dateOfBirth: '1999-05-10',
            studentId: 'S5678',
        };
    
        const createdStudent = {
            id: 2,
            ...newStudent,
        };
    
        // Simuler la réponse de la requête
        (pool.query as jest.Mock).mockResolvedValue({ rows: [createdStudent] });
    
        const response = await request(app)
            .post('/students')
            .send(newStudent)
            .set('Authorization', 'Bearer validToken'); // Assumer que le token est requis
    
        expect(response.status).toBe(201);
        expect(response.body).toEqual(createdStudent);
    
        // Adapter la requête attendue avec des sauts de ligne
        const expectedQueryPart = 'INSERT INTO students (first_name, last_name, email, date_of_birth, student_id)';
        const actualQuery = (pool.query as jest.Mock).mock.calls[0][0];
    
        expect(actualQuery).toContain(expectedQueryPart);
    
        // Vérification des paramètres
        const expectedParams = ['Jane', 'Smith', 'jane.smith@example.com', '1999-05-10', 'S5678'];
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining(expectedQueryPart), expectedParams);
    });         
});
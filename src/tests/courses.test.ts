import request from 'supertest';
import express from 'express';
import { courseRoutes } from '../routes/courses'; // Assure-toi que le chemin est correct

// Importation des types Express
import { Request, Response, NextFunction } from 'express';

// Mock des contrôleurs de cours
jest.mock('../controllers/courseController', () => ({
  courseController: {
    getAll: jest.fn((req, res) => {
      return res.status(200).json([
        { id: 1, code: 'CS101', name: 'Computer Science Basics', credits: 6 },
        { id: 2, code: 'MATH101', name: 'Calculus I', credits: 6 },
      ]);
    }),
    getById: jest.fn((req, res) => {
      const { id } = req.params;
      if (id === '1') {
        return res.status(200).json({ id: 1, code: 'CS101', name: 'Computer Science Basics', credits: 6 });
      } else {
        return res.status(404).json({ message: 'Course not found' });
      }
    }),
    create: jest.fn((req, res) => {
      const { code, name, credits } = req.body;
      if (code && name && credits) {
        return res.status(201).json({ id: 3, code, name, credits });
      } else {
        return res.status(400).json({ message: 'Invalid data' });
      }
    }),
    update: jest.fn((req, res) => {
      const { id } = req.params;
      if (id === '1') {
        return res.status(200).json({ id: 1, code: 'CS101', name: 'Updated Course', credits: 6 });
      } else {
        return res.status(404).json({ message: 'Course not found' });
      }
    }),
    delete: jest.fn((req, res) => {
      const { id } = req.params;
      if (id === '1') {
        return res.status(204).send();
      } else {
        return res.status(404).json({ message: 'Course not found' });
      }
    }),
  },
}));

// Middleware de validation mocké (ne fait rien ici)
jest.mock('../middleware/validate', () => ({
  validate: jest.fn((schema) => (req: Request, res: Response, next: NextFunction) => {
    next();
  }),
}));

// Définir l'application Express avec les routes
const app = express();
app.use(express.json());
app.use('/courses', courseRoutes);

describe('Courses API', () => {
  describe('GET /courses', () => {
    it('should return the list of courses', async () => {
      const response = await request(app).get('/courses');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, code: 'CS101', name: 'Computer Science Basics', credits: 6 },
        { id: 2, code: 'MATH101', name: 'Calculus I', credits: 6 },
      ]);
    });
  });

  describe('GET /courses/:id', () => {
    it('should return a course by ID', async () => {
      const response = await request(app).get('/courses/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, code: 'CS101', name: 'Computer Science Basics', credits: 6 });
    });

    it('should return 404 if course is not found', async () => {
      const response = await request(app).get('/courses/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Course not found' });
    });
  });

  describe('POST /courses', () => {
    it('should create a new course', async () => {
      const newCourse = { code: 'BIO101', name: 'Biology Basics', credits: 5 };
      const response = await request(app).post('/courses').send(newCourse);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 3, ...newCourse });
    });

    it('should return 400 if the data is invalid', async () => {
      const invalidCourse = { code: 'BIO101', name: '' }; // Missing credits
      const response = await request(app).post('/courses').send(invalidCourse);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Invalid data' });
    });
  });

  describe('PUT /courses/:id', () => {
    it('should update a course', async () => {
      const updatedCourse = { code: 'CS101', name: 'Updated Course', credits: 6 };
      const response = await request(app).put('/courses/1').send(updatedCourse);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, ...updatedCourse });
    });

    it('should return 404 if course is not found', async () => {
      const updatedCourse = { code: 'CS101', name: 'Updated Course', credits: 6 };
      const response = await request(app).put('/courses/999').send(updatedCourse);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Course not found' });
    });
  });

  describe('DELETE /courses/:id', () => {
    it('should delete a course', async () => {
      const response = await request(app).delete('/courses/1');

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should return 404 if course is not found', async () => {
      const response = await request(app).delete('/courses/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Course not found' });
    });
  });
});

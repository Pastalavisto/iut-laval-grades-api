import request from 'supertest';
import express from 'express';
import { gradeRoutes } from '../routes/grades'; // Assurez-vous que le chemin des routes est correct
import { Request, Response, NextFunction } from 'express';

// Mock du contrôleur de grade
jest.mock('../controllers/gradeController', () => ({
  gradeController: {
    getAll: jest.fn((req, res) => {
      return res.status(200).json([
        { id: 1, studentId: 1, courseId: 1, grade: 15, semester: 'S1', academicYear: '2023-2024' },
        { id: 2, studentId: 2, courseId: 2, grade: 18, semester: 'S2', academicYear: '2023-2024' }
      ]);
    }),
    getByStudent: jest.fn((req, res) => {
      const { studentId } = req.params;
      if (studentId === '1') {
        return res.status(200).json([
          { id: 1, studentId: 1, courseId: 1, grade: 15, semester: 'S1', academicYear: '2023-2024' }
        ]);
      } else {
        return res.status(404).json({ message: 'Student not found' });
      }
    }),
    generateTranscript: jest.fn((req, res) => {
      const { studentId } = req.params;
      const { academicYear } = req.query;
      if (studentId === '1' && academicYear === '2023-2024') {
        return res.status(200).send('PDF content'); // Simulation du PDF
      }
      return res.status(404).json({ message: 'Student not found or no grades' });
    }),
    create: jest.fn((req, res) => {
      const { studentId, courseId, grade, semester, academicYear } = req.body;
      if (studentId && courseId && grade !== undefined && semester && academicYear) {
        return res.status(201).json({
          id: 3,
          studentId,
          courseId,
          grade,
          semester,
          academicYear
        });
      }
      return res.status(400).json({ message: 'Invalid data' });
    }),
    update: jest.fn((req, res) => {
      const { id } = req.params;
      const { grade } = req.body;
      if (id === '1' && grade >= 0 && grade <= 20) {
        return res.status(200).json({ id, grade });
      }
      return res.status(404).json({ message: 'Grade not found' });
    }),
    delete: jest.fn((req, res) => {
      const { id } = req.params;
      if (id === '1') {
        return res.status(204).send();
      }
      return res.status(404).json({ message: 'Grade not found' });
    })
  }
}));

// Middleware mocké avec types
jest.mock('../middleware/validate', () => ({
  validate: jest.fn((schema) => (req: Request, res: Response, next: NextFunction) => {
    next();
  })
}));

// Configuration de l'application Express
const app = express();
app.use(express.json());
app.use('/grades', gradeRoutes);

describe('Grades API', () => {
  describe('GET /grades', () => {
    it('should return the list of grades', async () => {
      const response = await request(app).get('/grades');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, studentId: 1, courseId: 1, grade: 15, semester: 'S1', academicYear: '2023-2024' },
        { id: 2, studentId: 2, courseId: 2, grade: 18, semester: 'S2', academicYear: '2023-2024' }
      ]);
    });
  });

  describe('GET /grades/student/:studentId', () => {
    it('should return the grades of a student', async () => {
      const response = await request(app).get('/grades/student/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, studentId: 1, courseId: 1, grade: 15, semester: 'S1', academicYear: '2023-2024' }
      ]);
    });

    it('should return 404 if student is not found', async () => {
      const response = await request(app).get('/grades/student/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Student not found' });
    });
  });

  describe('GET /grades/student/:studentId/transcript', () => {
    it('should generate a transcript for a student', async () => {
      const response = await request(app).get('/grades/student/1/transcript?academicYear=2023-2024');

      expect(response.status).toBe(200);
      expect(response.text).toBe('PDF content');
    });

    it('should return 404 if student is not found or no grades', async () => {
      const response = await request(app).get('/grades/student/999/transcript?academicYear=2023-2024');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Student not found or no grades' });
    });
  });

  describe('POST /grades', () => {
    it('should create a new grade', async () => {
      const newGrade = {
        studentId: 1,
        courseId: 2,
        grade: 16,
        semester: 'S1',
        academicYear: '2023-2024'
      };
      const response = await request(app).post('/grades').send(newGrade);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: 3,
        ...newGrade
      });
    });

    it('should return 400 if the data is invalid', async () => {
      const invalidGrade = { studentId: 1, courseId: 2, grade: 16 }; // Missing semester and academicYear
      const response = await request(app).post('/grades').send(invalidGrade);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Invalid data' });
    });
  });

  describe('PUT /grades/:id', () => {
    it('should update a grade', async () => {
      const updatedGrade = { grade: 17 };
      const response = await request(app).put('/grades/1').send(updatedGrade);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '1', grade: 17 });
    });

    it('should return 404 if grade is not found', async () => {
      const updatedGrade = { grade: 17 };
      const response = await request(app).put('/grades/999').send(updatedGrade);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Grade not found' });
    });
  });

  describe('DELETE /grades/:id', () => {
    it('should delete a grade', async () => {
      const response = await request(app).delete('/grades/1');

      expect(response.status).toBe(204);
    });

    it('should return 404 if grade is not found', async () => {
      const response = await request(app).delete('/grades/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Grade not found' });
    });
  });
});

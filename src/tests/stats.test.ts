import request from 'supertest';
import express from 'express';
import { statsRoutes } from '../routes/stats';  // Assurez-vous que le chemin est correct
import { statsController } from '../controllers/statsController';
import { Request, Response, NextFunction } from 'express';

// Mock du contrôleur de statistiques
jest.mock('../controllers/statsController', () => ({
  statsController: {
    getGlobalStats: jest.fn((req: Request, res: Response) => {
      return res.status(200).json({
        globalAverage: 15.5,
        totalStudents: 200,
        totalCourses: 10,
        averageSuccessRate: 85
      });
    }),
    getCourseStats: jest.fn((req: Request, res: Response) => {
      const { courseId } = req.params;
      if (courseId === '1') {
        return res.status(200).json({
          courseCode: 'CS101',
          courseName: 'Computer Science 101',
          averageGrade: 14.5,
          minGrade: 8,
          maxGrade: 18,
          totalStudents: 50,
          successRate: 80
        });
      }
      return res.status(404).json({ message: 'Course not found' });
    }),
    getStudentSemesterStats: jest.fn((req: Request, res: Response) => {
      const { studentId } = req.params;
      if (studentId === '1') {
        return res.status(200).json([
          {
            semester: 'S1',
            averageGrade: 14.5,
            totalCredits: 30,
            validatedCredits: 30,
            coursesCount: 5
          },
          {
            semester: 'S2',
            averageGrade: 12,
            totalCredits: 30,
            validatedCredits: 20,
            coursesCount: 5
          }
        ]);
      }
      return res.status(404).json({ message: 'Student not found' });
    })
  }
}));

// Middleware mocké pour valider les paramètres
jest.mock('../middleware/validate', () => ({
  validate: jest.fn((schema) => (req: Request, res: Response, next: NextFunction) => {
    if (req.query.academicYear && !/^(\d{4})-(\d{4})$/.test(req.query.academicYear as string)) {
      return res.status(400).json({ message: 'Validation failed', errors: [{ message: 'Academic year must be in the format YYYY-YYYY' }] });
    }
    next();
  })
}));

// Configuration de l'application Express
const app = express();
app.use(express.json());
app.use('/stats', statsRoutes);

describe('Stats API', () => {
  describe('GET /stats/global', () => {
    it('should return global statistics', async () => {
      const response = await request(app).get('/stats/global').query({ academicYear: '2023-2024' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        globalAverage: 15.5,
        totalStudents: 200,
        totalCourses: 10,
        averageSuccessRate: 85
      });
    });

    it('should return 400 if academicYear is invalid', async () => {
      const response = await request(app).get('/stats/global').query({ academicYear: '2023' });

      // La validation ne passant pas, il doit renvoyer une erreur 400
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.errors[0].message).toBe('Academic year must be in the format YYYY-YYYY');
    });
  });

  describe('GET /stats/course/:courseId', () => {
    it('should return course statistics', async () => {
      const response = await request(app).get('/stats/course/1').query({ academicYear: '2023-2024' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        courseCode: 'CS101',
        courseName: 'Computer Science 101',
        averageGrade: 14.5,
        minGrade: 8,
        maxGrade: 18,
        totalStudents: 50,
        successRate: 80
      });
    });

    it('should return 404 if course not found', async () => {
      const response = await request(app).get('/stats/course/999').query({ academicYear: '2023-2024' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Course not found' });
    });
  });

  describe('GET /stats/student/:studentId', () => {
    it('should return semester statistics for student', async () => {
      const response = await request(app).get('/stats/student/1').query({ academicYear: '2023-2024' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          semester: 'S1',
          averageGrade: 14.5,
          totalCredits: 30,
          validatedCredits: 30,
          coursesCount: 5
        },
        {
          semester: 'S2',
          averageGrade: 12,
          totalCredits: 30,
          validatedCredits: 20,
          coursesCount: 5
        }
      ]);
    });

    it('should return 404 if student not found', async () => {
      const response = await request(app).get('/stats/student/999').query({ academicYear: '2023-2024' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Student not found' });
    });
  });
});

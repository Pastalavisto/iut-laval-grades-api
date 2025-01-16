import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Mock des dépendances avant d'importer les routes
jest.mock('../middleware/validate', () => ({
  validate: jest.fn(() => (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: 'Validation error' });
    }
    next();
  }),
}));

// Mock du contrôleur avant d'importer les routes
jest.mock('../controllers/authController', () => ({
  authController: {
    login: jest.fn((req: Request, res: Response) => {
      // Le mock retournera 500 dans ce cas précis si l'email est 'error@example.com'
      if (req.body.email === 'error@example.com') {
        return res.status(500).json({ message: 'Internal server error' });
      }
      
      // Comportement normal pour d'autres cas
      if (req.body.email === 'valid@example.com' && req.body.password === 'password123') {
        return res.status(200).json({
          token: 'valid.jwt.token',
          professor: {
            id: 1,
            email: 'valid@example.com',
            firstName: 'John',
            department: 'Mathematics',
          },
        });
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    }),
  },
}));

// Importer les routes après avoir mocké
import { authRoutes } from '../routes/auth';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.resetModules(); // Reset des modules pour s'assurer que les mocks sont appliqués
    jest.clearAllMocks(); // Clear les mocks
  });

  describe('POST /auth/login', () => {
    it('should authenticate and return a token and professor details for valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'valid@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token: 'valid.jwt.token',
        professor: {
          id: 1,
          email: 'valid@example.com',
          firstName: 'John',
          department: 'Mathematics',
        },
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'invalid@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should return 400 for missing email or password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'valid@example.com' }); // Password missing

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 500 for server errors', async () => {
      // Suppression des logs pour éviter le bruit dans les tests
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Utilisation d'un email particulier pour tester l'erreur 500
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'error@example.com', password: 'password123' });

      // Vérifier que le statut et le message sont corrects
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal server error');
    });
  });
});
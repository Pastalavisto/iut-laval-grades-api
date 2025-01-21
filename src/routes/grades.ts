/**
 * @swagger
 * components:
 *   schemas:
 *     Grade:
 *       type: object
 *       required:
 *         - studentId
 *         - courseId
 *         - grade
 *         - semester
 *         - academicYear
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré de la note
 *         studentId:
 *           type: integer
 *           description: ID de l'étudiant
 *         courseId:
 *           type: integer
 *           description: ID du cours
 *         grade:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 20
 *           description: Note sur 20
 *         semester:
 *           type: string
 *           enum: [S1, S2, S3, S4]
 *           description: Semestre
 *         academicYear:
 *           type: string
 *           pattern: ^\d{4}-\d{4}$
 *           description: Année académique
 *
 *     GradeWithDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/Grade'
 *         - type: object
 *           properties:
 *             studentFirstName:
 *               type: string
 *             studentLastName:
 *               type: string
 *             courseCode:
 *               type: string
 *             courseName:
 *               type: string
 */

/**
 * @swagger
 * /grades:
 *   get:
 *     summary: Récupère toutes les notes
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notes avec détails
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GradeWithDetails'
 *
 *   post:
 *     summary: Ajoute une nouvelle note
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       201:
 *         description: Note créée
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Étudiant ou cours non trouvé
 *
 * /grades/student/{studentId}:
 *   get:
 *     summary: Récupère les notes d'un étudiant
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notes de l'étudiant
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GradeWithDetails'
 *
 * /grades/{id}:
 *   put:
 *     summary: Met à jour une note
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grade
 *             properties:
 *               grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 20
 *     responses:
 *       200:
 *         description: Note mise à jour
 *       404:
 *         description: Note non trouvée
 *
 *   delete:
 *     summary: Supprime une note
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Note supprimée
 *       404:
 *         description: Note non trouvée
 *
 * /grades/student/{studentId}/transcript:
 *   get:
 *     summary: Génère le relevé de notes d'un étudiant
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^\d{4}-\d{4}$
 *     responses:
 *       200:
 *         description: Relevé de notes en PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Étudiant non trouvé ou pas de notes
 * 
 * /grades/years:
 *  get:
 *    summary: Récupère les années académiques des notes
 *    tags: [Grades]
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: Liste des années académiques
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: string
 *                pattern: ^\d{4}-\d{4}$
 *                example: ["2020-2021", "2021-2022"]
 *      404:
 *        description: Aucune année académique trouvée
 * 
 */

import { Router } from 'express';
import { gradeController } from '../controllers/gradeController';
import { validate } from '../middleware/validate';
import { createGradeSchema } from '../schemas/grade.schema';
import { z } from 'zod';
import { transcriptSchema } from '../schemas/grade.schema';

const router = Router();

router.get('/', gradeController.getAll);
router.get('/student/:studentId', gradeController.getByStudent);
router.get(
  '/student/:studentId/transcript',
  validate(transcriptSchema),
  gradeController.generateTranscript
);
router.post('/', validate(createGradeSchema), gradeController.create);
router.put(
  '/:id',
  validate(z.object({ grade: z.number().min(0).max(20) })),
  gradeController.update
);
router.delete('/:id', gradeController.delete);

router.get('/years', gradeController.getYears);

export const gradeRoutes = router;

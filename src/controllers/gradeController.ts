import { Request, Response } from 'express';
import { pool } from '../config/database';
import { CreateGradeInput } from '../schemas/grade.schema';
import { AppError } from '../types/error';
import { PDFService } from '../services/pdfService';

export const gradeController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(`
        SELECT g.id, g.grade, g.semester, g.academic_year as "academicYear",
               s.first_name as "studentFirstName", s.last_name as "studentLastName",
               c.code as "courseCode", c.name as "courseName"
        FROM grades g
        JOIN students s ON s.id = g.student_id
        JOIN courses c ON c.id = g.course_id
        ORDER BY g.academic_year DESC, g.semester DESC
      `);
      res.json(result.rows);
    } catch (error) {
      throw new AppError(
        500,
        'Erreur lors de la récupération des notes',
        'GRADES_FETCH_ERROR'
      );
    }
  },

  async getByStudent(req: Request, res: Response): Promise<void> {
    const { studentId } = req.params;
    try {
      const result = await pool.query(
        `
        SELECT g.id, g.grade, g.semester, g.academic_year as "academicYear",
               c.code as "courseCode", c.name as "courseName", c.credits
        FROM grades g
        JOIN courses c ON c.id = g.course_id
        WHERE g.student_id = $1
        ORDER BY g.academic_year DESC, g.semester DESC
      `,
        [studentId]
      );
      res.json(result.rows);
    } catch (error) {
      throw new AppError(
        500,
        "Erreur lors de la récupération des notes de l'étudiant",
        'GRADES_FETCH_ERROR'
      );
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    const {
      studentId,
      courseId,
      grade,
      semester,
      academicYear,
    }: CreateGradeInput = req.body;
    try {
      const studentExists = await pool.query(
        'SELECT id FROM students WHERE id = $1',
        [studentId]
      );
      const courseExists = await pool.query(
        'SELECT id FROM courses WHERE id = $1',
        [courseId]
      );

      if (studentExists.rows.length === 0) {
        throw new AppError(404, 'Étudiant non trouvé', 'STUDENT_NOT_FOUND');
      }
      if (courseExists.rows.length === 0) {
        throw new AppError(404, 'Cours non trouvé', 'COURSE_NOT_FOUND');
      }

      const result = await pool.query(
        `
        INSERT INTO grades (student_id, course_id, grade, semester, academic_year)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, grade, semester, academic_year as "academicYear"
      `,
        [studentId, courseId, grade, semester, academicYear]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        500,
        'Erreur lors de la création de la note',
        'GRADE_CREATE_ERROR'
      );
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { grade } = req.body;
    try {
      const result = await pool.query(
        `
        UPDATE grades
        SET grade = $1
        WHERE id = $2
        RETURNING id, grade, semester, academic_year as "academicYear"
      `,
        [grade, id]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Note non trouvée', 'GRADE_NOT_FOUND');
      }

      res.json(result.rows[0]);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        500,
        'Erreur lors de la mise à jour de la note',
        'GRADE_UPDATE_ERROR'
      );
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM grades WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Note non trouvée', 'GRADE_NOT_FOUND');
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        500,
        'Erreur lors de la suppression de la note',
        'GRADE_DELETE_ERROR'
      );
    }
  },

  async generateTranscript(req: Request, res: Response): Promise<void> {
    const { studentId } = req.params;
    const { academicYear } = req.query as { academicYear: string };

    try {
      const studentResult = await pool.query(
        'SELECT first_name as "firstName", last_name as "lastName", student_id as "studentId" FROM students WHERE id = $1',
        [studentId]
      );

      if (studentResult.rows.length === 0) {
        throw new AppError(404, 'Étudiant non trouvé', 'STUDENT_NOT_FOUND');
      }

      const gradesResult = await pool.query(
        `
        SELECT 
          c.code as "courseCode",
          c.name as "courseName",
          c.credits,
          g.grade,
          g.semester
        FROM grades g
        JOIN courses c ON c.id = g.course_id
        WHERE g.student_id = $1 AND g.academic_year = $2
        ORDER BY g.semester, c.code
      `,
        [studentId, academicYear]
      );

      if (gradesResult.rows.length === 0) {
        res.status(404).json({
          message: 'Aucune note trouvée pour cet étudiant',
          code: 'NO_GRADES_FOUND',
        });
      }

      const pdfBuffer = await PDFService.generateTranscript(
        {
          ...studentResult.rows[0],
          academicYear,
        },
        gradesResult.rows
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=releve_notes_${studentResult.rows[0].studentId}_${academicYear}.pdf`
      );

      await new Promise<void>((resolve, reject) => {
        res.write(pdfBuffer, (err) => {
          if (err) reject(err);
          res.end(() => resolve());
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        500,
        'Erreur lors de la génération du relevé',
        'PDF_GENERATION_ERROR'
      );
    }
  },

  async getYears(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        'SELECT DISTINCT academic_year as "academicYear" FROM grades ORDER BY academic_year DESC'
      );
      const academicYears: string[] = result.rows.map((row) => row.academicYear);
      res.json(academicYears);
    } catch (error) {
      res.status(500).json({
        message: 'Erreur lors de la récupération des années académiques',
        code: 'ACADEMIC_YEARS_FETCH_ERROR',
      });
    }
  }
};

import { z } from 'zod';

export const createGradeSchema = z.object({
  studentId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  grade: z.number().min(0).max(20),
  semester: z.string().regex(/^S(10|[1-9])$/),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
});

export type CreateGradeInput = z.infer<typeof createGradeSchema>;

export const transcriptSchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
});

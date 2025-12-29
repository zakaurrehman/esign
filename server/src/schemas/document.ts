import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  htmlContent: z.string().optional()
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  htmlContent: z.string().optional()
});

export const addRecipientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  signingOrder: z.number().int().positive().optional()
});

export const addFieldSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
  fieldType: z.enum(['SIGNATURE', 'INITIALS', 'DATE', 'TEXT', 'CHECKBOX']),
  pageNumber: z.number().int().positive(),
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
  widthPercent: z.number().min(0).max(100),
  heightPercent: z.number().min(0).max(100),
  isRequired: z.boolean().optional()
});

export const updateFieldSchema = z.object({
  xPercent: z.number().min(0).max(100).optional(),
  yPercent: z.number().min(0).max(100).optional(),
  widthPercent: z.number().min(0).max(100).optional(),
  heightPercent: z.number().min(0).max(100).optional(),
  isRequired: z.boolean().optional()
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type AddRecipientInput = z.infer<typeof addRecipientSchema>;
export type AddFieldInput = z.infer<typeof addFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;

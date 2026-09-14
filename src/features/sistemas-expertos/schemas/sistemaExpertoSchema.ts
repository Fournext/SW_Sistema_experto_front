import { z } from 'zod';

export const sistemaExpertoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del sistema experto es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede exceder los 150 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder los 500 caracteres')
    .optional()
    .or(z.literal('')),
  activo: z.boolean(),
});

export type SistemaExpertoFormData = z.infer<typeof sistemaExpertoSchema>;

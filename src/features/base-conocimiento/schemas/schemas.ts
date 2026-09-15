import { z } from 'zod';

export const hechoSchema = z
  .object({
    nombre: z
      .string()
      .min(1, 'El nombre del hecho es obligatorio')
      .max(100, 'Máximo 100 caracteres'),
    valor: z.string().min(1, 'El valor del hecho es obligatorio'),
    tipo_dato: z.enum(['TEXTO', 'ENTERO', 'DECIMAL', 'BOOLEANO'], {
      message: 'Selecciona un tipo de dato válido (TEXTO, ENTERO, DECIMAL, BOOLEANO)',
    }),
    es_inicial: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const val = data.valor.trim();
    if (data.tipo_dato === 'BOOLEANO') {
      const lower = val.toLowerCase();
      if (lower !== 'true' && lower !== 'false') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valor'],
          message: 'El valor debe ser "true" o "false" para un hecho booleano',
        });
      }
    } else if (data.tipo_dato === 'ENTERO') {
      if (!/^-?\d+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valor'],
          message: 'El valor debe ser un número entero válido (sin decimales ni letras)',
        });
      }
    } else if (data.tipo_dato === 'DECIMAL') {
      if (isNaN(Number(val)) || !/^-?\d+(\.\d+)?$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valor'],
          message: 'El valor debe ser un número decimal válido (ej: 12.5)',
        });
      }
    }
  });

export const variableSchema = z
  .object({
    nombre: z
      .string()
      .min(1, 'El nombre de la variable es obligatorio')
      .max(100, 'Máximo 100 caracteres'),
    tipo: z.enum(['TEXTO', 'ENTERO', 'DECIMAL', 'BOOLEANO'], {
      message: 'Selecciona un tipo de dato válido (TEXTO, ENTERO, DECIMAL, BOOLEANO)',
    }),
    valor_por_defecto: z.string().optional().or(z.literal('')),
    descripcion: z.string().max(300, 'Máximo 300 caracteres').optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.valor_por_defecto && data.valor_por_defecto.trim() !== '') {
      const val = data.valor_por_defecto.trim();
      if (data.tipo === 'BOOLEANO') {
        const lower = val.toLowerCase();
        if (lower !== 'true' && lower !== 'false') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['valor_por_defecto'],
            message: 'El valor por defecto debe ser "true" o "false"',
          });
        }
      } else if (data.tipo === 'ENTERO') {
        if (!/^-?\d+$/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['valor_por_defecto'],
            message: 'El valor por defecto debe ser un número entero (sin decimales)',
          });
        }
      } else if (data.tipo === 'DECIMAL') {
        if (isNaN(Number(val)) || !/^-?\d+(\.\d+)?$/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['valor_por_defecto'],
            message: 'El valor por defecto debe ser un número decimal válido (ej: 0.5)',
          });
        }
      }
    }
  });

export const reglaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El identificador o nombre de la regla es obligatorio (ej: R1, Regla_Fiebre)')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  prioridad: z.coerce
    .number()
    .min(0, 'La prioridad debe ser un número mayor o igual a 0'),
  factor_certeza: z.coerce
    .number()
    .min(0, 'El factor de certeza mínimo es 0.0')
    .max(1, 'El factor de certeza máximo es 1.0'),
  activa: z.boolean(),
});

export const condicionSchema = z.object({
  referencia: z
    .string()
    .min(1, 'La variable o hecho de referencia es obligatorio'),
  operador: z.enum(['==', '!=', '>', '<', '>=', '<='], {
    message: 'Selecciona un operador de comparación válido',
  }),
  valor_esperado: z.string().min(1, 'El valor esperado es obligatorio'),
  orden: z.coerce.number().min(1, 'El orden debe ser 1 o mayor'),
});

export const conclusionSchema = z.object({
  destino: z
    .string()
    .min(1, 'La variable de destino o conclusión es obligatoria'),
  valor_resultante: z
    .string()
    .min(1, 'El valor resultante asignado es obligatorio'),
});

export type HechoFormData = z.infer<typeof hechoSchema>;
export type VariableFormData = z.infer<typeof variableSchema>;
export type ReglaFormData = z.infer<typeof reglaSchema>;
export type CondicionFormData = z.infer<typeof condicionSchema>;
export type ConclusionFormData = z.infer<typeof conclusionSchema>;

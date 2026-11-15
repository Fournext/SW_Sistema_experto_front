const CLAVES_SIN_PREFIJO = new Set([
  'non_field_errors',
  'nonfielderrors',
  '__all__',
  'detail',
  'error',
  'message',
  'errors',
]);

const ETIQUETAS_CAMPO: Record<string, string> = {
  username: 'Usuario',
  password: 'Contraseña',
  password_confirm: 'Confirmación de contraseña',
  new_password: 'Nueva contraseña',
  old_password: 'Contraseña actual',
  email: 'Correo electrónico',
  first_name: 'Nombre',
  last_name: 'Apellido',
  nombre: 'Nombre',
  descripcion: 'Descripción',
  prioridad: 'Prioridad',
  factor_certeza: 'Factor de certeza',
  valor_esperado: 'Valor esperado',
  valor_resultante: 'Valor resultante',
  tipo_dato: 'Tipo de dato',
  hechos_iniciales: 'Hechos iniciales',
};

function formatearNombreCampo(campo: string): string {
  const normalizado = campo.toLowerCase().trim();
  if (ETIQUETAS_CAMPO[normalizado]) {
    return ETIQUETAS_CAMPO[normalizado];
  }
  const legible = campo.replace(/_/g, ' ').trim();
  return legible.charAt(0).toUpperCase() + legible.slice(1);
}

function extraerMensajesDeObjeto(obj: Record<string, unknown>): string[] {
  const mensajes: string[] = [];

  for (const [clave, valor] of Object.entries(obj)) {
    if (valor == null) continue;
    const sinPrefijo = CLAVES_SIN_PREFIJO.has(clave.toLowerCase().trim());

    if (typeof valor === 'string') {
      const texto = valor.trim();
      if (!texto) continue;
      mensajes.push(sinPrefijo ? texto : `${formatearNombreCampo(clave)}: ${texto}`);
    } else if (Array.isArray(valor)) {
      const partes = valor
        .flatMap((item) => {
          if (typeof item === 'string') return [item.trim()];
          if (item && typeof item === 'object') {
            return extraerMensajesDeObjeto(item as Record<string, unknown>);
          }
          return [];
        })
        .filter(Boolean);

      if (partes.length > 0) {
        const unido = partes.join(' ');
        mensajes.push(sinPrefijo ? unido : `${formatearNombreCampo(clave)}: ${unido}`);
      }
    } else if (typeof valor === 'object') {
      const anidados = extraerMensajesDeObjeto(valor as Record<string, unknown>);
      if (anidados.length > 0) {
        mensajes.push(...anidados);
      }
    }
  }

  return mensajes;
}

export function extraerMensajeErrorAPI(
  data: unknown,
  fallback = 'Ocurrió un error inesperado en la comunicación con el servidor.'
): string {
  if (!data) return fallback;

  if (typeof data === 'string') {
    const limpio = data.trim();
    // Evitar volcar páginas HTML completas de error 500/404
    if (limpio.startsWith('<!DOCTYPE') || limpio.startsWith('<html')) {
      return fallback;
    }
    return limpio || fallback;
  }

  if (typeof data !== 'object') return fallback;

  const obj = data as Record<string, unknown>;

  if (obj.errors && typeof obj.errors === 'object') {
    const lista = extraerMensajesDeObjeto(obj.errors as Record<string, unknown>);
    if (lista.length > 0) return lista.join(' · ');
  }

  const directo = obj.detail || obj.message || obj.error;
  if (typeof directo === 'string' && directo.trim()) {
    return directo.trim();
  }

  const campos = extraerMensajesDeObjeto(obj);
  if (campos.length > 0) {
    return campos.join(' · ');
  }

  return fallback;
}


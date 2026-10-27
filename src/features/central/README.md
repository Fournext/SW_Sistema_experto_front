# Contrato de Admin Central

La interfaz consume el cliente HTTP compartido (base habitual `/api/v1`) y nunca inventa métricas ni registros. El backend de administración no estaba especificado; este módulo propone el siguiente contrato REST, concentrado en `services/centralService.ts` para adaptarlo cuando se publique el contrato definitivo.

Todos los listados aceptan un array directo o la página DRF `{ results: [...] }`. Los filtros actuales operan sobre los registros recibidos. Si el backend pagina, para búsquedas completas deberá implementarse paginación y filtros de servidor antes de gestionar grandes volúmenes.

| Recurso | Operaciones |
| --- | --- |
| `/central/panel/` | GET: `{ usuarios_activos, roles, sesiones_activas, total_accesos, accesos_recientes }` |
| `/central/usuarios/` | GET, POST |
| `/central/usuarios/:id/` | PATCH de identidad, `roles: number[]`, `is_active` |
| `/central/usuarios/:id/restablecer-password/` | POST `{ password }` |
| `/central/roles/` | GET, POST |
| `/central/roles/:id/` | PATCH, DELETE |
| `/central/sesiones/` | GET |
| `/central/sesiones/:id/revocar/` | POST |
| `/central/bitacora/` | GET |

Usuario: `{ id, username, nombre, email, is_active, roles: Rol[] }`. Creación requiere además `password`. Rol: `{ id, nombre, descripcion?, permisos: string[], usuarios_count? }`. Los permisos son los códigos completos con prefijo del catálogo local.

Sesión: `{ id, usuario: string, ip, fecha_inicio: ISO8601, ultimo_acceso?: ISO8601, activa: boolean }`. Evento: `{ id, usuario: string, evento, ip, fecha: ISO8601, resultado: string }`.

La API debe validar permisos en cada operación y aplicar sus políticas de credenciales y revocación. El frontend oculta las acciones según los permisos vigentes, solicita confirmación para revocaciones, cambios de estado y eliminación de roles, y muestra los errores devueltos por el servidor.

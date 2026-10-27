import { createContext } from 'react';

// Solo limita o habilita acciones dentro del espacio autorizado de una actividad.
// El backend vuelve a comprobar matrícula, autoría y permisos para cada operación.
export const PermisosTrabajoContext = createContext<ReadonlySet<string> | null>(null);

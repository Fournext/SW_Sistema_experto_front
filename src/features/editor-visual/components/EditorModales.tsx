import React from 'react';
import type { Hecho, Regla, Variable } from '@/features/base-conocimiento/types/types';
import CrearReglaRapidaModal from './CrearReglaRapidaModal';
import EditorPseudocodigoModal from './EditorPseudocodigoModal';

export interface EditorModalesProps {
  effectiveBaseId?: number | string;
  modalReglaRapidaAbierto: boolean;
  onCerrarModalReglaRapida: () => void;
  onReglaRapidaCreada: (regla: unknown) => Promise<void>;
  siguienteNumeroRegla: number;
  modalPseudocodigoAbierto: boolean;
  onCerrarModalPseudocodigo: () => void;
  onReglasPseudocodigoActualizadas: () => Promise<void>;
  reglas: Regla[];
  variables: Variable[];
  hechos: Hecho[];
}

export const EditorModales: React.FC<EditorModalesProps> = ({
  effectiveBaseId,
  modalReglaRapidaAbierto,
  onCerrarModalReglaRapida,
  onReglaRapidaCreada,
  siguienteNumeroRegla,
  modalPseudocodigoAbierto,
  onCerrarModalPseudocodigo,
  onReglasPseudocodigoActualizadas,
  reglas,
  variables,
  hechos,
}) => {
  if (!effectiveBaseId) return null;

  return (
    <>
      <CrearReglaRapidaModal
        isOpen={modalReglaRapidaAbierto}
        onClose={onCerrarModalReglaRapida}
        baseConocimientoId={effectiveBaseId}
        onReglaCreada={onReglaRapidaCreada}
        variablesExistentes={variables}
        hechosExistentes={hechos}
        siguienteNumeroRegla={siguienteNumeroRegla}
      />

      <EditorPseudocodigoModal
        isOpen={modalPseudocodigoAbierto}
        onClose={onCerrarModalPseudocodigo}
        baseConocimientoId={effectiveBaseId}
        reglasActuales={reglas}
        variablesExistentes={variables}
        onReglasActualizadas={onReglasPseudocodigoActualizadas}
      />
    </>
  );
};

export default EditorModales;


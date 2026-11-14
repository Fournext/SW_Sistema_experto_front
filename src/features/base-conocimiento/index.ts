// Public API: Base de Conocimiento Feature
export * from './types/types';
export * from './constants/queryKeys';
export * from './hooks/useBaseConocimiento';
export * from './utils/inferenciaTipos';
export { default as baseConocimientoService } from './services/baseConocimientoService';

// Componentes exportados para uso cruzado
export { ReglaEditorModal } from './components/ReglaEditorModal';
export { ReglaCard } from './components/ReglaCard';
export { HechoForm } from './components/HechoForm';
export { VariableForm } from './components/VariableForm';
export { HechosTab } from './components/HechosTab';
export { ReglasSection } from './components/ReglasSection';
export { VariablesSection } from './components/VariablesSection';


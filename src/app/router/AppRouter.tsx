import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

import SistemasExpertosPage from '@/features/sistemas-expertos/pages/SistemasExpertosPage';
import CrearSistemaExpertoPage from '@/features/sistemas-expertos/pages/CrearSistemaExpertoPage';
import DetalleSistemaExpertoPage from '@/features/sistemas-expertos/pages/DetalleSistemaExpertoPage';
import BaseConocimientoPage from '@/features/base-conocimiento/pages/BaseConocimientoPage';
import EditorVisualPage from '@/features/editor-visual/pages/EditorVisualPage';
import InferenciaPage from '@/features/inferencia/pages/InferenciaPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Raíz redirige al listado de sistemas expertos */}
        <Route path="/" element={<Navigate to="/sistemas" replace />} />

        {/* Módulo Sistemas Expertos */}
        <Route path="/sistemas" element={<SistemasExpertosPage />} />
        <Route path="/sistemas/nuevo" element={<CrearSistemaExpertoPage />} />
        <Route path="/sistemas/:id" element={<DetalleSistemaExpertoPage />} />

        {/* Submódulos específicos del Sistema Experto */}
        <Route path="/sistemas/:id/editor" element={<EditorVisualPage />} />
        <Route path="/sistemas/:id/base-conocimiento" element={<BaseConocimientoPage />} />
        <Route path="/sistemas/:id/inferencia" element={<InferenciaPage />} />

        {/* Redirección ante cualquier ruta no encontrada */}
        <Route path="*" element={<Navigate to="/sistemas" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;

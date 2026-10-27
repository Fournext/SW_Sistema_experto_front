import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import LandingPage from '@/features/landing/pages/LandingPage';
import SistemasExpertosPage from '@/features/sistemas-expertos/pages/SistemasExpertosPage';
import CrearSistemaExpertoPage from '@/features/sistemas-expertos/pages/CrearSistemaExpertoPage';
import DetalleSistemaExpertoPage from '@/features/sistemas-expertos/pages/DetalleSistemaExpertoPage';
import BaseConocimientoPage from '@/features/base-conocimiento/pages/BaseConocimientoPage';
import EditorVisualPage from '@/features/editor-visual/pages/EditorVisualPage';
import InferenciaPage from '@/features/inferencia/pages/InferenciaPage';
import HistorialInferenciaPage from '@/features/inferencia/pages/HistorialInferenciaPage';
import ValidacionPage from '@/features/validacion/pages/ValidacionPage';
import ActividadesDocentePage from '@/features/actividades/pages/ActividadesDocentePage';
import ActividadesEstudiantePage from '@/features/actividades/pages/ActividadesEstudiantePage';
import ResolverActividadPage from '@/features/actividades/pages/ResolverActividadPage';
import CursosPage from '@/features/actividades/pages/CursosPage';
import CursoDetallePage from '@/features/actividades/pages/CursoDetallePage';
import UnirseCursoPage from '@/features/actividades/pages/UnirseCursoPage';
import EntregasDocentePage from '@/features/actividades/pages/EntregasDocentePage';
import TrabajoActividadPage from '@/features/actividades/pages/TrabajoActividadPage';
import AuthGuard from '@/shared/guards/AuthGuard';
import PermisoGuard from '@/shared/guards/PermisoGuard';
import { Permisos } from '@/config/permisos';
import CentralLoginPage from '@/features/central/pages/CentralLoginPage';
import RegistroEstudiantePage from '@/features/central/pages/RegistroEstudiantePage';
import CentralLayout from '@/features/central/components/CentralLayout';
import PanelPage from '@/features/central/pages/PanelPage';
import UsuariosPage from '@/features/central/pages/UsuariosPage';
import RolesPage from '@/features/central/pages/RolesPage';
import PermisosPage from '@/features/central/pages/PermisosPage';
import SesionesPage from '@/features/central/pages/SesionesPage';
import BitacoraPage from '@/features/central/pages/BitacoraPage';

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/central/login" element={<CentralLoginPage />} />
    <Route path="/registro-estudiante" element={<RegistroEstudiantePage />} />
    <Route element={<AuthGuard />}>
      <Route element={<PermisoGuard permisos={[Permisos.CENTRAL_ACCEDER]} />}>
        <Route path="/central" element={<CentralLayout />}>
          <Route index element={<PanelPage />} />
          <Route element={<PermisoGuard permisos={[Permisos.CENTRAL_USUARIOS_VER]} />}><Route path="usuarios" element={<UsuariosPage />} /></Route>
          <Route element={<PermisoGuard permisos={[Permisos.CENTRAL_ROLES_VER]} />}><Route path="roles" element={<RolesPage />} /></Route>
          <Route element={<PermisoGuard permisos={[Permisos.CENTRAL_PERMISOS_VER]} />}><Route path="permisos" element={<PermisosPage />} /></Route>
          <Route element={<PermisoGuard permisos={[Permisos.CENTRAL_SESIONES_VER]} />}><Route path="sesiones" element={<SesionesPage />} /></Route>
          <Route element={<PermisoGuard permisos={[Permisos.CENTRAL_BITACORA_VER]} />}><Route path="bitacora" element={<BitacoraPage />} /></Route>
          <Route path="*" element={<Navigate to="/central" replace />} />
        </Route>
      </Route>
      <Route element={<MainLayout />}>
        <Route path="/cursos" element={<CursosPage />} />
        <Route path="/cursos/unirse" element={<UnirseCursoPage />} />
        <Route path="/cursos/:idCurso" element={<CursoDetallePage />} />
        <Route element={<PermisoGuard permisos={[Permisos.ENTREGAS_VER_TODAS]} />}>
          <Route path="/asignaciones/:idAsignacion/entregas" element={<EntregasDocentePage />} />
        </Route>
        <Route element={<PermisoGuard permisos={[Permisos.SISTEMAS_VER]} />}>
          <Route path="/sistemas" element={<SistemasExpertosPage />} />
          <Route path="/sistemas/:id" element={<DetalleSistemaExpertoPage />} />
        </Route>
        <Route element={<PermisoGuard permisos={[Permisos.SISTEMAS_CREAR]} />}><Route path="/sistemas/nuevo" element={<CrearSistemaExpertoPage />} /></Route>
        <Route element={<PermisoGuard permisos={[Permisos.EDITOR_VER]} />}><Route path="/sistemas/:id/editor" element={<EditorVisualPage />} /></Route>
        <Route element={<PermisoGuard permisos={[Permisos.BASE_CONOCIMIENTO_VER]} />}><Route path="/sistemas/:id/base-conocimiento" element={<BaseConocimientoPage />} /></Route>
        <Route element={<PermisoGuard permisos={[Permisos.INFERENCIA_EJECUTAR]} />}><Route path="/sistemas/:id/inferencia" element={<InferenciaPage />} /></Route>
        <Route element={<PermisoGuard permisos={[Permisos.INFERENCIA_HISTORIAL_VER]} />}><Route path="/sistemas/:id/historial" element={<HistorialInferenciaPage />} /></Route>
        <Route element={<PermisoGuard permisos={[Permisos.VALIDACION_VER]} />}><Route path="/sistemas/:id/validacion" element={<ValidacionPage />} /></Route>
        <Route element={<PermisoGuard permisos={[Permisos.ACTIVIDADES_VER]} />}><Route path="/actividades" element={<ActividadesDocentePage />} /></Route>
        <Route element={<PermisoGuard permisos={[Permisos.ACTIVIDADES_RESOLVER]} />}>
          <Route path="/mis-actividades" element={<ActividadesEstudiantePage />} />
          <Route path="/actividades/resolver/:idAsignacion" element={<ResolverActividadPage />} />
          <Route path="/actividades/resolver/:idAsignacion/sistemas/:id/:herramienta" element={<TrabajoActividadPage />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
export default AppRouter;

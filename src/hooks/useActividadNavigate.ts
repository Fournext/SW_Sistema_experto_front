import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function useActividadNavigate() {
  const navigate = useNavigate();
  const { idAsignacion } = useParams();
  return useCallback((to: string) => {
    if (idAsignacion && /^\/sistemas\/[^/]+/.test(to)) {
      const modulo = to.match(/^\/sistemas\/([^/]+)\/([^/?]+)/);
      navigate(modulo
        ? `/actividades/resolver/${idAsignacion}/sistemas/${modulo[1]}/${modulo[2]}`
        : `/actividades/resolver/${idAsignacion}`);
      return;
    }
    navigate(to);
  }, [navigate, idAsignacion]);
}

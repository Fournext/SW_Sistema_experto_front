import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ArrowUpRight, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';
import { Permisos, usePuede } from '../../../config/permisos';
import CentralSidebar from './CentralSidebar';
import '../central.css';

export default function CentralLayout() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const canSystems = usePuede(Permisos.SISTEMAS_VER);
  const canActivities = usePuede(Permisos.ACTIVIDADES_VER);
  const canResolve = usePuede(Permisos.ACTIVIDADES_RESOLVER);
  const canSoftware = canSystems || canActivities || canResolve;
  async function signOut() { setLeaving(true); logout(); navigate('/central/login', { replace: true }); }
  return <div className="central-app"><CentralSidebar open={open} onClose={() => setOpen(false)} /><div className="central-main"><header className="central-topbar"><button className="central-menu" aria-label="Abrir menú" onClick={() => setOpen(true)}><Menu size={22} /></button><span className="central-topbar-label">CENTRO DE GESTIÓN <span>/</span> Acceso seguro</span><div className="central-topbar-actions">{canSoftware && <Link className="central-software-link" to={canSystems ? '/sistemas' : canActivities ? '/actividades' : '/mis-actividades'}>Ir al Software Experto <ArrowUpRight size={16} /></Link>}<div className="central-profile"><span>{(user?.nombre || user?.username || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{user?.nombre || user?.username}</strong><small>Administración</small></div></div><button className="central-logout" disabled={leaving} onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /><span>Cerrar sesión</span></button></div></header><main className="central-content"><Outlet /></main><footer className="central-footer">ADMIN CENTRAL <span>Plataforma de Sistemas Expertos · Gestión de acceso</span></footer></div></div>;
}

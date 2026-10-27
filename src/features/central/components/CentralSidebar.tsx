import { NavLink } from 'react-router-dom';
import { Activity, BookOpen, Fingerprint, LayoutDashboard, ShieldCheck, Users, X } from 'lucide-react';
import { Permisos, usePuede } from '../../../config/permisos';

const navigation = [
  { to: '/central', label: 'Panel general', icon: LayoutDashboard, permiso: Permisos.CENTRAL_ACCEDER },
  { to: '/central/usuarios', label: 'Usuarios', icon: Users, permiso: Permisos.CENTRAL_USUARIOS_VER },
  { to: '/central/roles', label: 'Roles', icon: ShieldCheck, permiso: Permisos.CENTRAL_ROLES_VER },
  { to: '/central/permisos', label: 'Permisos', icon: Fingerprint, permiso: Permisos.CENTRAL_PERMISOS_VER },
  { to: '/central/sesiones', label: 'Sesiones', icon: Activity, permiso: Permisos.CENTRAL_SESIONES_VER },
  { to: '/central/bitacora', label: 'Bitácora', icon: BookOpen, permiso: Permisos.CENTRAL_BITACORA_VER },
];
function SidebarLink({ item, onClose }: { item: typeof navigation[number]; onClose: () => void }) {
  const allowed = usePuede(item.permiso);
  return allowed ? <NavLink onClick={onClose} end={item.to === '/central'} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}><item.icon size={19} /><span>{item.label}</span></NavLink> : null;
}
export default function CentralSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <><button aria-label="Cerrar navegación" className={`central-backdrop ${open ? 'visible' : ''}`} onClick={onClose} /><aside className={`central-sidebar ${open ? 'open' : ''}`}><div className="central-brand"><span className="central-brand-mark"><ShieldCheck size={27} /></span><div>Admin Central<small>SISTEMAS EXPERTOS</small></div><button className="central-mobile-close" onClick={onClose} aria-label="Cerrar menú"><X size={20} /></button></div><p className="central-nav-label">ADMINISTRACIÓN</p><nav aria-label="Administración central">{navigation.map(item => <SidebarLink key={item.to} item={item} onClose={onClose} />)}</nav><div className="central-sidebar-note"><span className="central-live-dot" /> Un solo acceso.<br /><strong>Todo bajo control.</strong><p>Identidades, permisos y seguridad en un mismo lugar.</p></div></aside></>;
}

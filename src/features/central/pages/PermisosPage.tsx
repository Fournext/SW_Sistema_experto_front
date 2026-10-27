import { useState } from 'react';
import { Search, Fingerprint } from 'lucide-react';
import { CATALOGO_PERMISOS } from '../../../config/permisos';
import { CentralHeading, Empty } from '../components/CentralUI';

export default function PermisosPage() {
  const [search, setSearch] = useState(''); const [resource, setResource] = useState('');
  const permissions = CATALOGO_PERMISOS.filter(p => (!resource || p.recurso === resource) && `${p.nombre} ${p.codigo} ${p.modulo}`.toLowerCase().includes(search.toLowerCase()));
  return <><CentralHeading eyebrow="04 / CATÁLOGO DE ACCESO" title="Cada acción, un permiso." description={`${CATALOGO_PERMISOS.length} permisos atómicos para definir el alcance de cada rol.`} /><div className="central-toolbar"><label className="central-search"><Search size={18} /><input aria-label="Buscar permiso" placeholder="Buscar nombre o código…" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Filtrar por recurso" value={resource} onChange={e => setResource(e.target.value)}><option value="">Todos los recursos</option>{[...new Set(CATALOGO_PERMISOS.map(p => p.recurso))].map(r => <option key={r}>{r}</option>)}</select><span className="central-count">{permissions.length} permisos</span></div><section className="central-card"><div className="central-table-scroll"><table className="central-table"><thead><tr><th>Permiso</th><th>Código de acceso</th><th>Módulo</th></tr></thead><tbody>{permissions.map(p => <tr key={p.codigo}><td className="central-strong"><span className="central-inline-icon"><Fingerprint size={16} />{p.nombre}</span></td><td><code>{p.codigo}</code></td><td>{p.modulo}</td></tr>)}</tbody></table></div>{!permissions.length && <Empty>No hay permisos que coincidan con la búsqueda.</Empty>}</section></>;
}

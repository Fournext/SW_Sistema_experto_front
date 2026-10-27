import { dateLabel, useCentralQuery } from '../services/centralQuery';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Monitor, X } from 'lucide-react';
import { Permisos, usePuede } from '../../../config/permisos';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { centralService, type CentralSession } from '../services/centralService';
import { CentralHeading, Empty, ErrorNotice, QueryState } from '../components/CentralUI';

export default function SesionesPage() {
  const query = useCentralQuery('sesiones', centralService.sesiones); const client = useQueryClient();
  const canRevoke = usePuede(Permisos.CENTRAL_SESIONES_REVOCAR);
  const [search, setSearch] = useState(''); const [selected, setSelected] = useState<CentralSession | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const sessions = (query.data ?? []).filter(s => `${s.usuario} ${s.ip}`.toLowerCase().includes(search.toLowerCase()));
  async function revoke() { if (!selected) return; setBusy(true); setError(''); try { await centralService.revocarSesion(selected.id); setSelected(null); await client.invalidateQueries({ queryKey: ['central'] }); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo revocar la sesión.'); } finally { setBusy(false); } }
  return <><CentralHeading eyebrow="05 / MONITOREO" title="Conexiones bajo control." description="Consulta las sesiones y revoca accesos cuando sea necesario." /><ErrorNotice message={error} /><div className="central-toolbar"><label className="central-search"><Search size={18} /><input aria-label="Buscar sesión" placeholder="Buscar usuario o dirección IP…" value={search} onChange={e => setSearch(e.target.value)} /></label><button className="central-btn secondary" onClick={() => query.refetch()}>Actualizar</button></div><QueryState loading={query.isPending} error={query.error} retry={query.refetch} />{query.data && <section className="central-card"><div className="central-table-scroll"><table className="central-table"><thead><tr><th>Usuario</th><th>Dirección IP</th><th>Inicio de sesión</th><th>Última actividad</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{sessions.map(s => <tr key={s.id}><td className="central-strong"><span className="central-inline-icon"><Monitor size={17} />{s.usuario}</span></td><td><code>{s.ip}</code></td><td>{dateLabel(s.fecha_inicio)}</td><td>{dateLabel(s.ultimo_acceso)}</td><td><span className={`central-badge ${s.activa ? 'positive' : ''}`}>{s.activa ? 'Activa' : 'Finalizada'}</span></td><td>{canRevoke && s.activa && <button className="central-text-button danger" onClick={() => setSelected(s)}><X size={15} />Revocar</button>}</td></tr>)}</tbody></table></div>{!sessions.length && <Empty>No hay sesiones para mostrar.</Empty>}</section>}<ConfirmDialog isOpen={!!selected} onClose={() => !busy && setSelected(null)} onConfirm={revoke} title="Revocar sesión" message={`Se cerrará el acceso de ${selected?.usuario ?? ''} en este dispositivo.`} confirmText="Revocar acceso" loading={busy} /></>;
}

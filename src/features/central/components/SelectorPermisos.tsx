import { CATALOGO_PERMISOS, Permisos } from '../../../config/permisos';

function requiredViewPermissions(code: string): string[] {
  const required = new Set<string>();
  const readCode = code.replace(/_(crear|editar|eliminar|desactivar|revocar)$/, '_ver');
  if (CATALOGO_PERMISOS.some(p => p.codigo === readCode)) required.add(readCode);
  if (/_editor_(nodos|conexiones)_/.test(code)) required.add(Permisos.EDITOR_VER);
  if (/_central_/.test(code)) required.add(Permisos.CENTRAL_ACCEDER);
  if (/_(hechos|variables|reglas)_/.test(code)) required.add(Permisos.BASE_CONOCIMIENTO_VER);
  return [...required];
}

export default function SelectorPermisos({ value, onChange, disabled = false }: { value: string[]; onChange: (value: string[]) => void; disabled?: boolean }) {
  const modules = [...new Set(CATALOGO_PERMISOS.map(p => p.modulo))];
  const warnings = CATALOGO_PERMISOS.filter(p => value.includes(p.codigo) && /_(crear|editar|eliminar|desactivar|revocar)$/.test(p.codigo) && requiredViewPermissions(p.codigo).some(code => !value.includes(code)));
  function toggle(codes: string[], selected: boolean) { onChange(selected ? [...new Set([...value, ...codes])] : value.filter(code => !codes.includes(code))); }
  return <div className="central-permission-selector">{warnings.length > 0 && <p role="status" className="central-warning">Hay permisos de edición sin su permiso de lectura. Revisa las opciones «ver» para asegurar una navegación completa.</p>}{modules.map(module => { const permissions = CATALOGO_PERMISOS.filter(p => p.modulo === module); const selected = permissions.filter(p => value.includes(p.codigo)).length; return <fieldset key={module}><legend>{module} <span>{selected}/{permissions.length}</span></legend><label className="central-check central-select-all"><input type="checkbox" disabled={disabled} checked={selected === permissions.length} onChange={e => toggle(permissions.map(p => p.codigo), e.target.checked)} />Seleccionar módulo</label><div className="central-permission-grid">{permissions.map(p => <label key={p.codigo} className="central-check"><input type="checkbox" disabled={disabled} checked={value.includes(p.codigo)} onChange={e => toggle([p.codigo], e.target.checked)} /><span>{p.nombre}<small>{p.codigo}</small></span></label>)}</div></fieldset>; })}</div>;
}

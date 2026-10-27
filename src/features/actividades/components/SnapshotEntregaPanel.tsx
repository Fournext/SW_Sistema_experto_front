const registro = (valor: unknown): Record<string, unknown> => valor && typeof valor === 'object' && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
const lista = (valor: unknown): Record<string, unknown>[] => Array.isArray(valor) ? valor.map(registro) : [];
const texto = (valor: unknown) => valor == null || valor === '' ? 'Sin valor' : String(valor);

export default function SnapshotEntregaPanel({ snapshot }: { snapshot: Record<string, unknown> }) {
  const bc = registro(snapshot.bc);
  const hechos = lista(bc.hechos);
  const variables = lista(bc.variables);
  const reglas = lista(bc.reglas);
  const nombres = new Map([...hechos, ...variables].map((h) => [String(h.id), String(h.nombre)]));
  const nombre = (id: unknown) => nombres.get(String(id)) ?? 'Dato';
  const ejecuciones = lista(snapshot.ejecuciones);
  return <div className="space-y-5">
    <section><h3 className="text-sm font-bold text-stone-900">Respuesta escrita</h3><p className="text-sm text-stone-700 whitespace-pre-wrap bg-stone-50 border border-stone-200 p-4 rounded-xl mt-2">{snapshot.solucion_texto ? String(snapshot.solucion_texto) : 'Sin respuesta escrita.'}</p></section>
    <section><h3 className="text-sm font-bold text-stone-900">Base de conocimiento enviada</h3><p className="text-xs text-stone-500 mt-1">{String(bc.nombre ?? 'BC de la entrega')} · {hechos.length} hechos · {variables.length} variables · {reglas.length} reglas</p>
      <div className="grid md:grid-cols-2 gap-3 mt-3">
        <div className="border border-stone-200 rounded-xl p-3"><h4 className="font-semibold text-xs mb-2">Hechos</h4>{hechos.length ? <ul className="space-y-1 text-xs font-mono">{hechos.map((h, i) => <li key={String(h.id ?? i)}>{texto(h.nombre)} = {texto(h.valor)}</li>)}</ul> : <p className="text-xs text-stone-500">Sin hechos.</p>}</div>
        <div className="border border-stone-200 rounded-xl p-3"><h4 className="font-semibold text-xs mb-2">Variables</h4>{variables.length ? <ul className="space-y-1 text-xs font-mono">{variables.map((v, i) => <li key={String(v.id ?? i)}>{texto(v.nombre)} = {texto(v.valor_defecto ?? v.valor_por_defecto)}</li>)}</ul> : <p className="text-xs text-stone-500">Sin variables.</p>}</div>
      </div>
      <div className="space-y-2 mt-3">{reglas.map((r, i) => <details key={String(r.id ?? i)} className="border border-stone-200 rounded-xl p-3"><summary className="font-semibold text-sm cursor-pointer">{texto(r.nombre)}</summary>
        <div className="text-xs font-mono text-stone-700 mt-3 space-y-2">{lista(r.condiciones).map((c, j) => <p key={j}>{j === 0 ? 'SI' : 'Y'} {nombre(c.hecho_id ?? c.variable_id)} {texto(c.operador)} {texto(c.valor_esperado)}</p>)}
          {lista(r.conclusiones).map((c, j) => <p key={j} className="text-teal-800">ENTONCES {nombre(c.hecho_resultante_id ?? c.variable_resultante_id)} = {texto(c.valor_resultante)}</p>)}</div>
      </details>)}</div>
    </section>
    <section><h3 className="font-bold text-sm">Ejecuciones adjuntas</h3>{ejecuciones.length ? <div className="space-y-3 mt-2">{ejecuciones.map((e, i) => <details key={String(e.id ?? i)} className="border border-teal-200 bg-teal-50/40 p-3 rounded-xl">
      <summary className="text-sm font-semibold cursor-pointer">{e.es_simulacion ? 'Simulación paso a paso' : 'Inferencia directa'} · {texto(e.estado)}</summary>
      <p className="text-sm mt-2 text-teal-950">Conclusión: {e.conclusion_final ? String(e.conclusion_final) : 'Sin conclusión'}</p>
      <ul className="text-xs mt-3 space-y-1">{lista(e.detalles).filter((d) => (d.estado_regla ?? d.estado) === 'EJECUTADA').map((d, j) => <li key={j}>{texto(d.regla_nombre ?? d.nombre_regla ?? d.regla ?? lista(registro(e.bc_snapshot).reglas).find((r) => String(r.id) === String(d.regla_id))?.nombre ?? reglas.find((r) => String(r.id) === String(d.regla_id))?.nombre)}: {texto(d.resultado_generado)}</li>)}</ul>
    </details>)}</div> : <p className="text-xs text-stone-500 mt-2">No se adjuntaron ejecuciones.</p>}</section>
  </div>;
}

import React, { useRef, useEffect } from 'react';
import type { ErrorCompilacion } from '../types/contracts';

interface EditorAlgoritmoProps {
  codigo: string;
  onChange: (nuevoCodigo: string) => void;
  errores?: ErrorCompilacion[];
  readOnly?: boolean;
}

export const EditorAlgoritmo: React.FC<EditorAlgoritmoProps> = ({
  codigo,
  onChange,
  errores = [],
  readOnly = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineas = codigo.split('\n');
  const totalLineas = Math.max(lineas.length, 1);

  // Mapear líneas con errores para marcarlas en el gutter
  const lineasConError = new Set(
    errores.map((e) => e.linea).filter((l): l is number => typeof l === 'number')
  );

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    '; // 4 espacios

      const nuevoValor =
        codigo.substring(0, start) + spaces + codigo.substring(end);
      onChange(nuevoValor);

      // Restaurar cursor después de los 4 espacios
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
            start + spaces.length;
        }
      }, 0);
    }
  };

  useEffect(() => {
    handleScroll();
  }, [codigo]);

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 font-mono text-sm shadow-inner">
      {/* Gutter con números de línea */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden bg-slate-950/80 px-3 py-3 text-right text-slate-500 border-r border-slate-800"
        style={{ minWidth: '3.5rem' }}
      >
        {Array.from({ length: totalLineas }).map((_, i) => {
          const numLinea = i + 1;
          const tieneError = lineasConError.has(numLinea);
          return (
            <div
              key={numLinea}
              className={`h-6 leading-6 ${
                tieneError
                  ? 'font-bold text-rose-500 bg-rose-950/40 rounded px-1'
                  : ''
              }`}
            >
              {numLinea}
            </div>
          );
        })}
      </div>

      {/* Área de texto editable */}
      <textarea
        ref={textareaRef}
        value={codigo}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className="h-full flex-1 resize-none bg-transparent p-3 leading-6 text-slate-100 outline-none selection:bg-blue-600/40 focus:ring-0 whitespace-pre overflow-auto font-mono text-sm"
        placeholder="// Escriba su algoritmo de inferencia pedagógico aquí..."
      />
    </div>
  );
};


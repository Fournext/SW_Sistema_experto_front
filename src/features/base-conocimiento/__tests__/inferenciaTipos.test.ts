import { describe, it, expect } from 'vitest';
import { inferirTipoDato } from '../utils/inferenciaTipos';
import type { Variable, Hecho } from '../types/types';

describe('inferirTipoDato', () => {
  it('debe detectar BOOLEANO para true, false, si, no', () => {
    expect(inferirTipoDato('true')).toBe('BOOLEANO');
    expect(inferirTipoDato('false')).toBe('BOOLEANO');
    expect(inferirTipoDato('si')).toBe('BOOLEANO');
    expect(inferirTipoDato('no')).toBe('BOOLEANO');
    expect(inferirTipoDato('SI')).toBe('BOOLEANO');
    expect(inferirTipoDato('NO')).toBe('BOOLEANO');
  });

  it('debe detectar ENTERO para enteros positivos, negativos y cero', () => {
    expect(inferirTipoDato('0')).toBe('ENTERO');
    expect(inferirTipoDato('42')).toBe('ENTERO');
    expect(inferirTipoDato('-15')).toBe('ENTERO');
  });

  it('debe detectar DECIMAL para números de coma flotante', () => {
    expect(inferirTipoDato('3.14')).toBe('DECIMAL');
    expect(inferirTipoDato('0.001')).toBe('DECIMAL');
    expect(inferirTipoDato('-10.5')).toBe('DECIMAL');
  });

  it('debe detectar TEXTO para cadenas no numéricas', () => {
    expect(inferirTipoDato('gato')).toBe('TEXTO');
    expect(inferirTipoDato('ABC-123')).toBe('TEXTO');
    expect(inferirTipoDato('')).toBe('TEXTO');
  });

  it('debe priorizar el tipo de una variable existente en el catálogo', () => {
    const vars: Variable[] = [
      { id: 1, nombre: 'edad', tipo: 'ENTERO', tipo_dato: 'ENTERO' },
      { id: 2, nombre: 'temperatura', tipo: 'DECIMAL', tipo_dato: 'DECIMAL' },
      { id: 3, nombre: 'estado', tipo: 'OPCION', tipo_dato: 'OPCION', opciones: ['activo', 'inactivo'] },
    ];

    // Aunque el valor sea 'activo' (que sin contexto sería TEXTO), reconoce que 'estado' es OPCION
    expect(inferirTipoDato('activo', 'estado', vars)).toBe('OPCION');
    // Aunque el valor sea '25' (que sería ENTERO), si 'temperatura' es DECIMAL, debe devolver DECIMAL
    expect(inferirTipoDato('25', 'temperatura', vars)).toBe('DECIMAL');
  });

  it('debe priorizar el tipo de un hecho existente en el catálogo', () => {
    const hechos: Hecho[] = [
      { id: 1, nombre: 'fiebre', valor: 'si', tipo_dato: 'BOOLEANO', es_inicial: true },
    ];

    expect(inferirTipoDato('desconocido', 'fiebre', [], hechos)).toBe('BOOLEANO');
  });
});


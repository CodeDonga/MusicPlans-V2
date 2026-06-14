import { parseFecha, isSameDay } from '../fechas';

describe('parseFecha', () => {
  test('parsea DD/MM/YYYY', () => {
    const d = parseFecha('13/06/2026');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // junio (0-indexed)
    expect(d.getDate()).toBe(13);
  });

  test('parsea YYYY-MM-DD', () => {
    const d = parseFecha('2026-06-13');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(13);
  });

  test('acepta separador "-" en formato DD-MM-YYYY', () => {
    const d = parseFecha('13-06-2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getDate()).toBe(13);
  });

  test('parsea 29/02 en año bisiesto', () => {
    const d = parseFecha('29/02/2024');
    expect(d).toBeInstanceOf(Date);
    expect(d.getDate()).toBe(29);
  });

  describe('entradas inválidas → null', () => {
    test.each([
      ['null', null],
      ['undefined', undefined],
      ['cadena vacía', ''],
      ['no string', 123],
      ['solo dos partes', '13/06'],
      ['partes no numéricas', 'ab/cd/efgh'],
      ['año de dos dígitos', '13/06/26'],
    ])('%s', (_, entrada) => {
      expect(parseFecha(entrada)).toBeNull();
    });
  });

  describe('fechas fuera de rango → null', () => {
    test.each([
      ['mes 13', '13/13/2026'],
      ['mes 0', '13/00/2026'],
      ['día 0', '00/06/2026'],
      ['día 32', '32/06/2026'],
      ['año < 1900', '13/06/1899'],
    ])('%s', (_, entrada) => {
      expect(parseFecha(entrada)).toBeNull();
    });
  });

  describe('fechas imposibles rechazadas por roundtrip (BUG-10)', () => {
    test.each([
      ['30 de febrero', '30/02/2026'],
      ['31 de abril', '31/04/2026'],
      ['29/02 en año no bisiesto', '29/02/2023'],
    ])('%s', (_, entrada) => {
      expect(parseFecha(entrada)).toBeNull();
    });
  });
});

describe('isSameDay', () => {
  test('true para el mismo día con distinta hora', () => {
    const a = new Date(2026, 5, 13, 9, 0, 0);
    const b = new Date(2026, 5, 13, 18, 30, 0);
    expect(isSameDay(a, b)).toBe(true);
  });

  test('false para días distintos', () => {
    expect(isSameDay(new Date(2026, 5, 13), new Date(2026, 5, 14))).toBe(false);
  });

  test('false para mismo día/mes pero distinto año', () => {
    expect(isSameDay(new Date(2025, 5, 13), new Date(2026, 5, 13))).toBe(false);
  });

  test('false si algún argumento es nulo', () => {
    expect(isSameDay(null, new Date())).toBe(false);
    expect(isSameDay(new Date(), null)).toBe(false);
  });
});

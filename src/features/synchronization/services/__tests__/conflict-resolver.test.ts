import { payloadsEqual, resolveConflict } from '../conflict-resolver.service';
it('compares keys independently of order', () =>
  expect(payloadsEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true));
it('chooses requested conflict side', () =>
  expect(resolveConflict({ v: 1 }, { v: 2 }, 'remote')).toEqual({ v: 2 }));

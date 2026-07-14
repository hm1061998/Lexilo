import { mergeSyncOperations } from '../sqlite-sync-queue-repository';
describe('sync merge', () => {
  test.each([
    [null, 'create', 'create'],
    ['create', 'update', 'create'],
    ['update', 'update', 'update'],
    ['update', 'delete', 'delete'],
    ['create', 'delete', null],
  ] as const)('%s + %s -> %s', (existing, incoming, result) =>
    expect(mergeSyncOperations(existing, incoming)).toBe(result),
  );
});

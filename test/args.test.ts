import { describe, expect, it } from 'vitest';
import { intFlag, parseCommandArgs } from '../src/args.js';

describe('parseCommandArgs', () => {
  it('returns positionals and flags', () => {
    const parsed = parseCommandArgs('component', ['Button', '--full'], {
      full: { type: 'boolean' },
      id: { type: 'boolean' },
    });
    expect(parsed.positionals).toEqual(['Button']);
    expect(parsed.flags.full).toBe(true);
    expect(parsed.flags.id).toBeUndefined();
  });

  it('turns unknown flags into VALIDATION_ERROR', () => {
    expect(() =>
      parseCommandArgs('find', ['x', '--nope'], { limit: { type: 'string' } }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('turns a missing flag value into VALIDATION_ERROR', () => {
    expect(() =>
      parseCommandArgs('find', ['x', '--limit'], { limit: { type: 'string' } }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });
});

describe('intFlag', () => {
  it('uses the fallback when absent', () => {
    expect(intFlag('find', 'limit', undefined, 5)).toBe(5);
  });

  it('parses positive integers', () => {
    expect(intFlag('find', 'limit', '3', 5)).toBe(3);
  });

  it('rejects zero, negatives, and non-integers', () => {
    for (const value of ['0', '-1', '2.5', 'abc']) {
      expect(() => intFlag('find', 'limit', value, 5)).toThrowError(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: '--limit must be a positive integer',
        }),
      );
    }
  });
});

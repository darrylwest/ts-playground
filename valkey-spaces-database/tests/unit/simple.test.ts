/**
 * Simple test to verify Jest is working correctly
 */

describe('Basic Test Suite', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should handle numbers', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle strings', () => {
    expect('hello' + ' world').toBe('hello world');
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr).toContain(2);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });

  it('should handle mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
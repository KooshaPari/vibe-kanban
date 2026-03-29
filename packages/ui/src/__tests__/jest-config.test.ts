// Basic test to verify Jest configuration is working
describe('Jest Configuration', () => {
  it('should run basic tests', () => {
    expect(true).toBe(true);
  });

  it('should handle TypeScript', () => {
    const message: string = 'Hello Jest';
    expect(message).toBe('Hello Jest');
  });

  it('should have DOM environment available', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
  });

  it('should have mocked console methods available', () => {
    expect(jest).toBeDefined();
    expect(jest.fn).toBeDefined();
  });

  it('should support async/await', async () => {
    const result = await Promise.resolve('async works');
    expect(result).toBe('async works');
  });
});

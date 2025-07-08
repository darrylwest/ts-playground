import { handleCommand } from '../src/command-handler';

describe('Command Handler', () => {
  it('should respond with pong for ping command', async () => {
    const response = await handleCommand(Buffer.from('ping'));
    expect(response.response).toBe('pong');
  });
});

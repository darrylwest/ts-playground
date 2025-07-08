import net from 'net';
import fs from 'fs';
import { config } from './config';
import { handleCommand } from './command-handler';

const server = net.createServer(socket => {
  console.log('Client connected.');

  socket.on('data', async data => {
    const response = await handleCommand(data);
    socket.write(`${response}\n`);
  });

  socket.on('close', () => {
    console.log('Client disconnected.');
  });

  socket.on('error', err => {
    console.error('Socket error:', err);
  });
});

server.on('error', err => {
  console.error('Server error:', err);
});

// Graceful shutdown
const cleanup = () => {
  console.log('\nShutting down...');
  server.close(() => {
    if (fs.existsSync(config.socketPath)) {
      fs.unlinkSync(config.socketPath);
    }
    console.log('Server shut down.');
    process.exit(0);
  });
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
if (fs.existsSync(config.socketPath)) {
  fs.unlinkSync(config.socketPath);
}

server.listen(config.socketPath, () => {
  console.log(`Server listening on ${config.socketPath}`);
});

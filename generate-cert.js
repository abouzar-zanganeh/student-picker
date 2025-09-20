import { execSync } from 'child_process';
import { internalIpV4Sync } from 'internal-ip';

// Get the computer's current local IP address
const ip = internalIpV4Sync();

console.log(`- Found local IP: ${ip}`);
console.log('- Generating a new SSL certificate...');

// The command to run mkcert with the correct IP
const command = `mkcert -key-file localhost-key.pem -cert-file localhost.pem "localhost" ${ip}`;

try {
  execSync(command);
  console.log('- Certificate created successfully!');
} catch (error) {
  console.error('- Error creating certificate:', error.message);
  process.exit(1);
}
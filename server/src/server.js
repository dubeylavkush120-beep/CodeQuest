import dns from 'node:dns';
import net from 'node:net';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const origLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (!hostname || hostname === 'localhost' || net.isIP(hostname)) {
    return origLookup(hostname, options, callback);
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      if (options && options.all) {
        return callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
      }
      return callback(null, addresses[0], 4);
    }
    return origLookup(hostname, options, callback);
  });
};

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
dotenv.config({ path: path.join(projectRoot, '.env') });
const { default: app } = await import('./app.js');
const port = process.env.PORT || 5001;
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('Set JWT_SECRET to a random value of at least 32 characters before production startup.');
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codequest')
  .then(() => app.listen(port, '0.0.0.0', () => console.log(`CodeQuest API listening on ${port}`)))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });

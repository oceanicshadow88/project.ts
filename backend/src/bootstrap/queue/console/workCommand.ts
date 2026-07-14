/* eslint-disable no-console */

import { Application } from '../../application';
import { main } from '../worker';

const app = new Application();
app.init();

main(app).catch((err) => {
  console.error('[worker] fatal error', err);
  process.exit(1);
});

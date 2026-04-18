import { checkPassword, json } from './_helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }
  if (!checkPassword(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }
  return json(res, 200, { ok: true });
}

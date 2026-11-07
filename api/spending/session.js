import { handleSession } from '../../server/spending/handler.js';

export default function handler(req, res) {
  return handleSession(req, res);
}

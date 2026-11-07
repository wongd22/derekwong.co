import { handleLogout } from '../../server/spending/handler.js';

export default function handler(req, res) {
  return handleLogout(req, res);
}

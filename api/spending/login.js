import { handleLogin } from '../../server/spending/handler.js';

export default function handler(req, res) {
  return handleLogin(req, res);
}

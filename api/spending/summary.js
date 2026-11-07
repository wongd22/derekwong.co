import { handleSummary } from '../../server/spending/handler.js';

export default function handler(req, res) {
  return handleSummary(req, res);
}

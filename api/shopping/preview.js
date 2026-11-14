import { handlePreview } from '../../server/shopping/preview.js';

export default function handler(req, res) {
  return handlePreview(req, res);
}

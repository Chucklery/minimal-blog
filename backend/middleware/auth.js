// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'minimal-blog-dev-secret';

export async function requireAuth(req, reply) {
  const token = req.cookies?.token;
  if (!token) return reply.status(401).send({ success: false, message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    return reply.status(401).send({ success: false, message: 'Invalid token' });
  }
}

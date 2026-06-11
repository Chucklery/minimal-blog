// backend/services/authService.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { findByUsername, createUser } from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'minimal-blog-dev-secret';

export async function login(db, username, password) {
  const user = findByUsername(db, username);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  return { token, user: { id: user.id, username: user.username } };
}

export async function seedAdmin(db) {
  const existing = findByUsername(db, 'admin');
  if (existing) return;
  const hash = await bcrypt.hash('admin123', 10);
  createUser(db, 'admin', hash);
}

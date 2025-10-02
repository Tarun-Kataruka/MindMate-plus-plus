import jwt from 'jsonwebtoken';

const generateToken = (id, email) => {
  return jwt.sign(
    { sub: id, email },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export default generateToken;

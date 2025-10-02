import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token: generateToken(user._id, user.email),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    return res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email },
      token: generateToken(user._id, user.email),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

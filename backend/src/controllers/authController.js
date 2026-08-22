import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, societyId: user.societyId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyId: user.societyId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Registration is intentionally restricted — only super_admin/society_admin
// create accounts for other roles via a dedicated admin route, not public signup.
export async function register(req, res) {
  try {
    const { name, email, phone, password, role, societyId, flatId } = req.body;
    const user = await User.create({ name, email, phone, password, role, societyId, flatId });
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}

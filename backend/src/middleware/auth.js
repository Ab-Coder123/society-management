import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Layer 1: Authentication — verifies the JWT and attaches the user
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user; // { _id, role, societyId, flatId, ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Layer 2: Role Authorization — restricts route to specific roles
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

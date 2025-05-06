const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']; // Get the Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token missing or invalid' });
  }

  const authToken = authHeader.split(' ')[1]; // Extract the token
  if (!authToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(authToken, 'secret_key', (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.userId = user.id; // Attach the user ID to the request object
    next();
  });
}

module.exports = authenticateToken;
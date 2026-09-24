import jwt from 'jsonwebtoken';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Please log in first' });
  }

  // User abc123 something
  // ['User', 'abc123', 'something]
  const authHeaderParts = authHeader.split(' ');
  const loginToken = authHeaderParts[1];

  if (!loginToken) {
    return res.status(401).json({ message: 'Please log in first' });
  }

  try {
    const decodedToken = jwt.verify(loginToken, process.env.JWT_SECRET);

    req.userId = decodedToken.id;
    req.userName = decodedToken.name;

    // this tells Express to move on to the actual API route
    next();
    
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired login token' });
  }
}

export default requireAuth;

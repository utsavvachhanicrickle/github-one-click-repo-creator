export function requireGithubLogin(req, res, next) {
  if (!req.session.githubAccessToken || !req.session.githubUser) {
    return res.status(401).json({ message: 'Please login with GitHub first.' });
  }
  next();
}

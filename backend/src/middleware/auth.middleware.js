import {verifyRefreshToken } from "../utils/token.js"
import { COOKIESSCHEMA } from '../utils/schema.js';
import { User } from '../models/user.module.js';
import authValidations from '../validations/auth.validation.js';

export function requireGithubLogin(req, res, next) {
  if (!req.session.githubAccessToken || !req.session.githubUser) {
    return res.status(401).json({ message: 'Please login with GitHub first.' });
  }
  next();
}

export async function authenticateUser(req, res, next) {
  try {
    const refresh_token = req.cookies[COOKIESSCHEMA.REFRESH_TOKEN];
    authValidations.refreshToken(refresh_token);

    const decodedRefresh = await verifyRefreshToken(refresh_token);
    authValidations.decodedRefreshValidation(decodedRefresh);

    const user = await User.findUserByEmail({ email: decodedRefresh.email });
    authValidations.userNotFound({ user });

    req.user = user;
    next();
  } catch (error) {
    console.error('[authMiddleware] error:', error);
    return res.status(401).json({ authenticated: false, message: error.message });
  }
}


export async function authenticateAdminUser(req, res, next) {
  try {
    authValidations.isAdminUser({ user: req.user });
    next();
  } catch (error) {
    console.error('[authMiddleware-admin] error:', error);
    return res.status(403).json({ authenticated: false, message: error.message });
  }
}


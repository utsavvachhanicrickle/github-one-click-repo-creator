import { verifyAccessToken } from "../utils/token.js";
import { COOKIESSCHEMA } from "../utils/schema.js";
import { User } from "../models/user.module.js";
import authValidations from "../validations/auth.validation.js";

export function requireGithubLogin(req, res, next) {
  if (!req.session.githubAccessToken || !req.session.githubUser) {
    return res.status(401).json({ message: "Please login with GitHub first." });
  }
  next();
}

export async function authenticateUser(req, res, next) {
  try {
    const access_token = req.cookies[COOKIESSCHEMA.ACCESS_TOKEN];
    authValidations.refreshToken(access_token);

    const decodedToken = await verifyAccessToken(access_token);
    authValidations.decodedRefreshValidation(decodedToken);
    const user = await User.findUserByEmail({ email: decodedToken.email });
    authValidations.userNotFound({ user });

    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode && error.statusCode < 500) {
      console.log(
        `[authMiddleware] Guest or expired session: ${error.message}`,
      );
    } else {
      console.error("[authMiddleware] Unexpected error:", error);
    }
    return res
      .status(error.statusCode || 401)
      .json({ authenticated: false, message: error.message });
  }
}

export async function authenticateAdminUser(req, res, next) {
  try {
    authValidations.isAdminUser({ user: req.user });
    next();
  } catch (error) {
    console.error("[authMiddleware-admin] error:", error);
    return res
      .status(403)
      .json({ authenticated: false, message: error.message });
  }
}

import { verifyAccessToken } from "../utils/token.js";
import { COOKIESSCHEMA } from "../utils/schema.js";
import { User } from "../models/user.module.js";
import { pool } from "../db.js";
import authValidations from "../validations/auth.validation.js";

export async function requireGithubLogin(req, res, next) {
  try {
    const user = req.user;
    authValidations.userNotFound({user});

    let token = null;
    let login = null;
    let avatarUrl = null;

    const ownRes = await pool.query(
      `SELECT g.access_token, g.login, g.avatar_url FROM github g WHERE g.user_id = $1`,
      [user.id]
    );
    if (ownRes.rows.length > 0) {
      token = ownRes.rows[0].access_token;
      login = ownRes.rows[0].login;
      avatarUrl = ownRes.rows[0].avatar_url;
    }

    if (!token && user.role === "personal") {
      const adminRes = await pool.query(
        `SELECT g.access_token, g.login, g.avatar_url FROM adminpersonalrelation r 
         JOIN github g ON r.adminid = g.user_id 
         WHERE r.personalid = $1`,
        [user.id]
      );
      if (adminRes.rows.length > 0) {
        token = adminRes.rows[0].access_token;
        login = adminRes.rows[0].login;
        avatarUrl = adminRes.rows[0].avatar_url;
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Please connect your GitHub account first." });
    }

    req.session.githubAccessToken = token;
    req.session.githubUser = {
      login,
      avatar_url: avatarUrl
    };

    next();
  } catch (error) {
    console.error("[requireGithubLogin] validation error:", error);
    return res.status(500).json({ message: "Database query failure during GitHub check." });
  }
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

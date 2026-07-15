import axios from "axios";
import jwt from "jsonwebtoken";
import { Octokit } from "@octokit/rest";
import { config } from "../config.js";
import { User } from "../models/user.module.js";
import {
  loginService,
  registerUserService,
  registerPersonalUserService,
  adminPersonalUserRelationService,
} from "../services/auth.service.js";
import { MESSAGE } from "../utils/message.js";
import { setCookies } from "../utils/cookies.js";
import { COOKIESSCHEMA } from "../utils/schema.js";
import { verifyRefreshToken, genrateAccessToken } from "../utils/token.js";
import authValidations from "../validations/auth.validation.js";

export function githubLogin(req, res) {
  authValidations.userNotFound({ user: req.user });
  authValidations.isAdminUser({ user: req.user });
  const state = jwt.sign({ id: req.user.id }, config.jwtSecret, {
    expiresIn: "5m",
  });

  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: config.github.scopes,
    state,
    allow_signup: "true",
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

export async function githubCallback(req, res, next) {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${config.frontendUrl}/login?error=missing_code`);
    }

    // Verify JWT state to retrieve user id
    let decoded;
    try {
      decoded = jwt.verify(state, config.jwtSecret);
    } catch (err) {
      console.error("[githubCallback] Invalid OAuth state token:", err.message);
      return res.redirect(`${config.frontendUrl}/login?error=invalid_state`);
    }

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.callbackUrl,
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const accessToken = tokenResponse.data?.access_token;
    if (!accessToken) {
      return res.redirect(`${config.frontendUrl}/login?error=no_access_token`);
    }

    const octokit = new Octokit({ auth: accessToken });
    const { data: ghUser } = await octokit.users.getAuthenticated();

    console.log(decoded.id);

    // 1. Save or update credentials in PostgreSQL "github" table
    await User.upsertGithubCredentials({
      github_id: ghUser.id,
      user_id: decoded.id,
      access_token: accessToken,
      login: ghUser.login,
      avatar_url: ghUser.avatar_url,
      html_url: ghUser.html_url,
    });

    const user = await User.findUserById({ id: decoded.id });
    const redirectPath =
      user.role === "admin"
        ? `/admin/${user.unique_id}/settings?github=connected`
        : `/id/${user.unique_id}/settings?github=connected`;

    res.redirect(`${config.frontendUrl}${redirectPath}`);
  } catch (err) {
    console.error("[githubCallback] error:", err.message);
    next(err);
  }
}

export async function getMe(req, res) {
  const user = req.user;
  if (user) {
    if (user.role === "personal") {
      const adminRelations = await User.getAdminPersonalUserByPersonalId({
        personal_id: user.id,
      });
      if (adminRelations && adminRelations.length > 0) {
        const adminId = adminRelations[0].adminid;
        const userAdmin = await User.findUserById({ id: adminId });
        if (userAdmin) {
          return res.json({
            authenticated: true,
            user: {
              email: user.email,
              name: user.name,
              unique_id: user.unique_id,
              role: user.role,
              user_verified: user.user_verified,
              github_id: userAdmin.github_id,
              github_login: userAdmin.github_login,
              github_avatar_url: userAdmin.github_avatar_url,
            },
          });
        }
      }
    }

    return res.json({
      authenticated: true,
      user: {
        email: user.email,
        name: user.name,
        unique_id: user.unique_id,
        role: user.role,
        user_verified: user.user_verified,
        github_id: user.github_id,
        github_login: user.github_login,
        github_avatar_url: user.github_avatar_url,
      },
    });
  }
  return res
    .status(404)
    .json({ authenticated: false, message: MESSAGE.USER_NOT_FOUND });
}

export function logoutUser(req, res) {
  res.clearCookie(COOKIESSCHEMA.ACCESS_TOKEN);
  res.clearCookie(COOKIESSCHEMA.REFRESH_TOKEN);
  req.session.destroy(() => {
    res.clearCookie("repo_creator_sid");
    res.json({ ok: true });
  });
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    const result = await loginService(email, password);

    setCookies({
      type: COOKIESSCHEMA.ACCESS_TOKEN,
      token: result.access_token,
      maxAge: COOKIESSCHEMA.MAXAGE.ACCESS_TOKEN,
      res,
    });
    setCookies({
      type: COOKIESSCHEMA.REFRESH_TOKEN,
      token: result.refresh_token,
      maxAge: COOKIESSCHEMA.MAXAGE.REFRESH_TOKEN,
      res,
    });

    return res.status(200).json({
      success: true,
      message: MESSAGE.LOGIN_SUCCESS,
      user: result.user,
    });
  } catch (error) {
    console.error("[Login] failed:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || MESSAGE.SOMETHING_WRONG,
    });
  }
}

export async function registerUserController(req, res) {
  try {
    const { email, password, name } = req.body;

    const result = await registerUserService({ email, password, name });

    return res.status(200).json({
      success: true,
      message: MESSAGE.REGISTER_SUCCESS,
      user: result.user,
    });
  } catch (error) {
    console.error("[Register] failed:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || MESSAGE.SOMETHING_WRONG,
    });
  }
}

export async function registerPersonalUserController(req, res) {
  try {
    const { email, password, name } = req.body;
    const user = req.user;
    const result = await registerPersonalUserService({
      email,
      password,
      name,
      organization: user,
    });

    return res.status(200).json({
      success: true,
      message: MESSAGE.REGISTER_SUCCESS,
      relations: result.relations,
    });
  } catch (error) {
    console.error("[Register Personal User] failed:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || MESSAGE.SOMETHING_WRONG,
    });
  }
}

export async function adminPersonalUserRelationController(req, res) {
  try {
    const user = req.user;
    const result = await adminPersonalUserRelationService({
      admin_id: user.id,
    });
    return res.status(200).json({
      success: true,
      message: MESSAGE.REGISTER_SUCCESS,
      relations: result.relations,
    });
  } catch (error) {
    console.error("[Admin Personal User Relation] failed:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || MESSAGE.SOMETHING_WRONG,
    });
  }
}

export async function refreshTokenController(req, res) {
  try {
    const refresh_token = req.cookies[COOKIESSCHEMA.REFRESH_TOKEN];
    authValidations.refreshToken(refresh_token);

    const decoded = await verifyRefreshToken(refresh_token);
    authValidations.decodedRefreshValidation(decoded);
    const user = await User.findUserByEmail({ email: decoded.email });
    authValidations.userNotFound({ user });

    // Generate new access token
    const new_access_token = await genrateAccessToken({
      email: decoded.email,
      id: decoded.id,
    });

    // Set new access token cookie
    await setCookies({
      type: COOKIESSCHEMA.ACCESS_TOKEN,
      token: new_access_token,
      maxAge: COOKIESSCHEMA.MAXAGE.ACCESS_TOKEN,
      res,
    });

    return res
      .status(200)
      .json({ success: true, message: "Token refreshed successfully" });
  } catch (error) {
    console.error("[Refresh Token Error]:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired refresh token" });
  }
}

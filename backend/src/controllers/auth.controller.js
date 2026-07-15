import crypto from "crypto";
import axios from "axios";
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
  const state = crypto.randomBytes(24).toString("hex");
  req.session.githubOAuthState = state;

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

    if (state !== req.session.githubOAuthState) {
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
    const { data: user } = await octokit.users.getAuthenticated();

    // Save or update user in MongoDB
    await User.findOneAndUpdate(
      { githubId: user.id },
      {
        login: user.login,
        avatarUrl: user.avatar_url,
        htmlUrl: user.html_url,
        name: user.name,
      },
      { upsert: true, new: true },
    );

    req.session.githubAccessToken = accessToken;
    req.session.githubUser = {
      id: user.id,
      login: user.login,
      avatar_url: user.avatar_url,
      html_url: user.html_url,
      name: user.name,
    };

    delete req.session.githubOAuthState;

    res.redirect(`${config.frontendUrl}/dashboard`);
  } catch (err) {
    next(err);
  }
}

export function getMe(req, res) {
  const user = req.user;
  if (user) {
    return res.json({
      authenticated: true,
      user: {
        email: user.email,
        name: user.name,
        unique_id: user.unique_id,
        role: user.role,
        user_verified: user.user_verified,
      },
    });
  }
  return res
    .status(404)
    .json({ authenticated: false, message: MESSAGE.USER_NOT_FOUND });
}

export function logoutUser(req, res) {
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
    authValidations.refreshToken(refresh_token)

    const decoded = await verifyRefreshToken(refresh_token);
    authValidations.decodedRefreshValidation(decoded)
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

    return res.status(200).json({ success: true, message: "Token refreshed successfully" });
  } catch (error) {
    console.error("[Refresh Token Error]:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
}

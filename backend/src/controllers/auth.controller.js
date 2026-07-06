import crypto from 'crypto';
import axios from 'axios';
import { Octokit } from '@octokit/rest';
import { config } from '../config.js';
import { User } from '../models/User.js';

export function githubLogin(req, res) {
  const state = crypto.randomBytes(24).toString('hex');
  req.session.githubOAuthState = state;

  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: config.github.scopes,
    state,
    allow_signup: 'true'
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
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.callbackUrl
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
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
        name: user.name
      },
      { upsert: true, new: true }
    );


    req.session.githubAccessToken = accessToken;
    req.session.githubUser = {
      id: user.id,
      login: user.login,
      avatar_url: user.avatar_url,
      html_url: user.html_url,
      name: user.name
    };

    delete req.session.githubOAuthState;

    res.redirect(`${config.frontendUrl}/dashboard`);
  } catch (err) {
    next(err);
  }
}

export function getMe(req, res) {
  if (!req.session.githubAccessToken || !req.session.githubUser) {
    return res.status(401).json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: req.session.githubUser
  });
}

export function logoutUser(req, res) {
  req.session.destroy(() => {
    res.clearCookie('repo_creator_sid');
    res.json({ ok: true });
  });
}

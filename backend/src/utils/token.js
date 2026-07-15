import jwt from "jsonwebtoken";
import { MESSAGE } from "./message.js";
import { COOKIESSCHEMA } from "./schema.js";
import { config } from "../config.js";

export const genrateRefreshToken = async ({ email, id }) => {
  return jwt.sign({ email, id }, config.refreshTokenSecret, {
    expiresIn: COOKIESSCHEMA.MAXAGE.REFRESH_TOKEN,
  });
};

export const genrateAccessToken = async ({ email, id }) => {
  return jwt.sign({ email, id }, config.jwtSecret, { expiresIn: COOKIESSCHEMA.MAXAGE.ACCESS_TOKEN });
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    return jwt.verify(refreshToken, config.refreshTokenSecret);
  } catch (err) {
    throw new Error(MESSAGE.REFRESH_TOKEN_EXPIRED);
  }
};

export const verifyAccessToken = async (accessToken) => {
  try {
    return jwt.verify(accessToken, config.jwtSecret);
  } catch (err) {
    throw new Error("Access token expired");
  }
};
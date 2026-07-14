import { COOKIESSCHEMA } from "./schema.js";
import { config } from "../config.js";

export const setCookies = async({ type, token, maxAge, res }) => {
  res.cookie(type, token, {
    httpOnly: true,
    secure: config.nodeEnv === COOKIESSCHEMA.PRODUCTION,
    sameSite: "lax",
    maxAge: maxAge,
  });
};

export const clearAuthCookies = async(res) => {
  res.clearCookie(COOKIESSCHEMA.ACCESS_TOKEN);
  res.clearCookie(COOKIESSCHEMA.REFRESH_TOKEN);
};
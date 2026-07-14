export const COOKIESSCHEMA = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  MAXAGE: {
    ACCESS_TOKEN: 7 * 24 * 60 * 60 * 1000,
    REFRESH_TOKEN: 15 * 60 * 1000,
  },
  PRODUCTION: "production",
};

export const generatedOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};
import AppError from "../utils/AppError.js";
import { MESSAGE } from "../utils/message.js";

const authValidations = {
  decodedRefreshValidation: (decodedRefresh) => {
    if (!decodedRefresh) {
      throw new AppError(MESSAGE.INVALID_REFRESH_TOKEN, 403);
    }
  },
  notExistesData: (data) => {
    const { email, password } = data;

    if (!email || !password) {
      throw new AppError(MESSAGE.DATA_NOT_EXISTES, 400);
    }
  },
  passwordNotMatch: ({ isPasswordValid }) => {
    if (!isPasswordValid) {
      throw new AppError(MESSAGE.PASSWORD_NOT_MATCH, 401);
    }
  },
  refreshToken: (refresh_token) => {
    if (!refresh_token) {
      throw new AppError(MESSAGE.REFRESH_TOKEN_EXPIRED, 401);
    }
  },
  userFound: ({ user }) => {
    if (user) {
      throw new AppError(MESSAGE.EMAIL_ALREADY_EXISTS, 400);
    }
  },
  userNotFound: ({ user }) => {
    if (!user) {
      throw new AppError(MESSAGE.EMAIL_NOT_FOUND, 404);
    }
  },
  valideEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(MESSAGE.INVALID_EMAIL, 400);
    }
  },
  validePassword: (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new AppError(MESSAGE.INVALID_PASSWORD, 400);
    }
  },
  verifyUser: ({ user }) => {
    if (!user.user_verified) {
      throw new AppError(MESSAGE.USER_NOT_VERIFIED, 401);
    }
  },
};

export default authValidations;

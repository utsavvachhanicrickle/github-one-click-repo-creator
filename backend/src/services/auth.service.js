import { createPassword, comparePassword } from "../utils/bcrypt.js";
import { genrateAccessToken, genrateRefreshToken } from "../utils/token.js";
import authValidations from "../validations/auth.validation.js";
import { User } from "../models/user.module.js";
import { Otp } from "../models/otp.module.js";
import sendEmail from "../utils/sendEmail/sendEmail.js";
import { generatedOTP } from "../utils/schema.js";

export async function loginService(email, password) {
  authValidations.notExistesData({ email, password });
  authValidations.valideEmail(email);
  authValidations.validePassword(password);

  const user = await User.findUserByEmail({ email });
  authValidations.userNotFound({ user });

  const isPasswordValid = await comparePassword(password, user.password);
  authValidations.passwordNotMatch({ isPasswordValid });

  authValidations.verifyUser({ user });

  await User.updateLastLogin(user.id);

  const access_token = await genrateAccessToken({
    email,
    id: user._id,
    role: user.role,
  });
  const refresh_token = await genrateRefreshToken({
    email,
    id: user._id,
    role: user.role,
  });

  return {
    user: {
      unique_id: user.unique_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    access_token,
    refresh_token,
  };
}

export async function registerUserService({ email, password, name }) {
  authValidations.notExistesData({ email, password });
  authValidations.valideEmail(email);
  authValidations.validePassword(password);

  const userAlrady = await User.findUserByEmail({ email });
  authValidations.userFound({ user: userAlrady });

  const hashPassword = await createPassword(password);
  const unique_id = Math.random().toString(36).substring(2, 10);

  const user = await User.createUser({
    unique_id,
    email,
    password: hashPassword,
    name,
    role: "admin",
    user_verfied: true,
  });

  const otp_code = generatedOTP();

  const otp_res = await Otp.create({
    user_unique_id: user.unique_id,
    otp_code,
    expires_at: Date.now() + 1000 * 60 * 5,
  });
  await sendEmail.verificationEmail(email, otp_res.otp_code);

  return {
    user: {
      unique_id: user.unique_id,
      email: user.email,
    },
  };
}

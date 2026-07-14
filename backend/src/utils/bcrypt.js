
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

export const createPassword = async (password) => {
  return bcrypt.hash(password, config.bcryptSalt);
};

export const comparePassword = async (password, mainPassword) => {
  return bcrypt.compare(password, mainPassword);
};
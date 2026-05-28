import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

const SALT_ROUNDS = 10;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (user) => {
  const rest = { ...user };
  delete rest.password;
  return rest;
};

const parseBirthday = (birthday) => {
  if (birthday === undefined || birthday === null || birthday === '') {
    return undefined;
  }

  const date = new Date(birthday);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, birthday } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse(res, 409, 'Email already registered');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const parsedBirthday = parseBirthday(birthday);

    if (parsedBirthday === null) {
      return errorResponse(res, 400, 'Invalid birthday format');
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone,
        ...(parsedBirthday !== undefined ? { birthday: parsedBirthday } : {}),
      },
    });

    const token = signToken(user.id);
    res.cookie('token', token, COOKIE_OPTIONS);

    return successResponse(res, 201, 'Registration successful', {
      user: safeUser(user),
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const token = signToken(user.id);
    res.cookie('token', token, COOKIE_OPTIONS);

    return successResponse(res, 200, 'Login successful', {
      user: safeUser(user),
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  return successResponse(res, 200, 'Logout successful');
};

export const getProfile = async (req, res) => {
  return successResponse(res, 200, 'Profile retrieved', {
    user: safeUser(req.user),
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, birthday, avatar, cover_image } = req.body;

    const data = {};

    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (avatar !== undefined) data.avatar = avatar;
    if (cover_image !== undefined) data.cover_image = cover_image;

    const parsedBirthday = parseBirthday(birthday);

    if (parsedBirthday === null) {
      return errorResponse(res, 400, 'Invalid birthday format');
    }

    if (parsedBirthday !== undefined) {
      data.birthday = parsedBirthday;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    return successResponse(res, 200, 'Profile updated', {
      user: safeUser(updated),
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, 404, 'Email not found');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return successResponse(res, 200, 'Password updated successfully', {
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, 404, 'Email not found');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return successResponse(res, 200, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

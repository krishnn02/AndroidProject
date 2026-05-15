import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User, Role, type IUser } from '../models/index.js';
import { createError } from '../middleware/error.js';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: IUser;
  tokens: TokenPair;
}

class AuthService {
  /**
   * Generate access + refresh token pair
   */
  generateTokens(userId: string, role: Role): TokenPair {
    const accessToken = jwt.sign(
      { userId, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId, role },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw createError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw createError(403, 'Account is deactivated. Contact admin.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError(401, 'Invalid email or password');
    }

    const tokens = this.generateTokens(user._id.toString(), user.role as Role);

    // Store refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return { user, tokens };
  }

  /**
   * Register a new user (admin-created)
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    department: string;
    phone?: string;
    college?: string;
    role?: Role;
  }): Promise<IUser> {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw createError(409, 'Email already registered');
    }

    const user = await User.create({
      ...data,
      email: data.email.toLowerCase(),
      role: data.role || Role.USER,
    });

    return user;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string; role: Role };
      const user = await User.findById(decoded.userId).select('+refreshToken');

      if (!user || user.refreshToken !== refreshToken) {
        throw createError(401, 'Invalid refresh token');
      }

      const tokens = this.generateTokens(user._id.toString(), user.role as Role);
      user.refreshToken = tokens.refreshToken;
      await user.save();

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError(401, 'Refresh token expired. Please login again.');
      }
      throw createError(401, 'Invalid refresh token');
    }
  }

  /**
   * Logout - clear refresh token
   */
  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, 'User not found');
    }
    return user;
  }
}

export const authService = new AuthService();

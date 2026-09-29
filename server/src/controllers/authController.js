import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  rotateRefreshToken,
} from '../utils/jwt.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, orgName, siteName, role, language } = req.body;

    let organization = await Organization.findOne({ name: orgName });
    let isNewOrg = false;

    if (!organization) {
      organization = await Organization.create({
        name: orgName,
        sites: siteName ? [{ name: siteName }] : [],
      });
      isNewOrg = true;
    } else if (siteName) {
      const siteExists = organization.sites.some((s) => s.name === siteName);
      if (!siteExists) {
        organization.sites.push({ name: siteName });
        await organization.save();
      }
    }

    const existingUser = await User.findOne({ email, orgId: organization._id });
    if (existingUser) {
      throw new ConflictError('User with this email already exists in this organization');
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: isNewOrg ? 'admin' : role,
      orgId: organization._id,
      language,
    });

    await AuditLog.create({
      entityType: 'User',
      entityId: user._id,
      actorId: user._id,
      field: 'create',
      oldValue: null,
      newValue: { name, email, role, orgId: organization._id },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
          language: user.language,
        },
        organization: {
          id: organization._id,
          name: organization.name,
          sites: organization.sites,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
          language: user.language,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    const { userId, tokenVersion } = await import('../utils/jwt.js').then(
      (m) => m.verifyRefreshToken(refreshToken)
    );

    const user = await rotateRefreshToken(userId, tokenVersion);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
          language: user.language,
        },
      },
    });
  } catch (error) {
    clearTokenCookies(res);
    if (error.message === 'Invalid refresh token') {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    clearTokenCookies(res);
    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
          language: user.language,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
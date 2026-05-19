import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { prisma } from '@repo/db';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(MailService) private readonly mailService: MailService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  getAppUrl() {
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) throw new Error('Missing APP_URL');
    return appUrl;
  }

  async requestMagicLink(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    let user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await prisma.users.create({
        data: { email: normalizedEmail },
      });
    }

    const existing = await prisma.magicLinks.findFirst({
      where: {
        user_id: user.id,
        expires_at: { gt: new Date() },
      },
    });

    if (existing) {
      throw new BadRequestException('Magic link already sent. Please wait.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await prisma.magicLinks.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    const url = new URL('/auth/callback', this.getAppUrl());
    url.searchParams.set('token', token);

    try {
      await this.mailService.sendMagicLink(normalizedEmail, url.toString());
    } catch (error) {
      await prisma.magicLinks.deleteMany({
        where: { user_id: user.id },
      });

      throw error;
    }

    return { success: true };
  }

  async verifyMagicLink(
    token: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    const result = await prisma.$transaction(async (tx) => {
      const link = await tx.magicLinks.findFirst({
        where: {
          token_hash: tokenHash,
          expires_at: { gt: new Date() },
          used: false,
        },
        select: {
          id: true,
          user_id: true,
        },
      });

      if (!link) {
        throw new BadRequestException('Invalid or expired token.');
      }

      await tx.magicLinks.update({
        where: { id: link.id },
        data: { used: true },
      });

      const session = await tx.session.create({
        data: {
          userId: link.user_id,
          refreshTokenHash,
          userAgent: meta?.userAgent,
          ipAddress: meta?.ipAddress,
          expiresAt: refreshExpiresAt,
        },
        select: { id: true, userId: true },
      });

      const accessToken = await this.jwtService.signAsync({
        sub: session.userId,
        sessionId: session.id,
      });

      return { accessToken, refreshToken };
    });

    return result;
  }

  async loginWithGoogle(
    user: { email?: string; googleId?: string; name?: string; image?: string },
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    if (!user?.googleId) {
      throw new BadRequestException('Missing Google profile.');
    }

    const normalizedEmail = user.email?.trim().toLowerCase();

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    return prisma.$transaction(async (tx) => {
      let dbUser =
        (await tx.users.findFirst({
          where: { google_id: user.googleId },
        })) ??
        (normalizedEmail
          ? await tx.users.findUnique({ where: { email: normalizedEmail } })
          : null);

      if (!dbUser) {
        if (!normalizedEmail) {
          throw new BadRequestException('Google account missing email.');
        }

        dbUser = await tx.users.create({
          data: {
            email: normalizedEmail,
            google_id: user.googleId,
            name: user.name,
            image: user.image,
          },
        });
      } else if (!dbUser.google_id) {
        dbUser = await tx.users.update({
          where: { id: dbUser.id },
          data: {
            google_id: user.googleId,
            name: dbUser.name ?? user.name,
            image: dbUser.image ?? user.image,
          },
        });
      }

      const session = await tx.session.create({
        data: {
          userId: dbUser.id,
          refreshTokenHash,
          userAgent: meta?.userAgent,
          ipAddress: meta?.ipAddress,
          expiresAt: refreshExpiresAt,
        },
        select: { id: true, userId: true },
      });

      const accessToken = await this.jwtService.signAsync({
        sub: session.userId,
        sessionId: session.id,
      });

      return { accessToken, refreshToken };
    });
  }

  async refreshSession(refreshToken: string) {
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await prisma.session.findFirst({
      where: {
        refreshTokenHash,
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Invalid refresh token');
    }

    const newRefreshToken = crypto.randomBytes(48).toString('hex');

    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        refreshTokenHash: newRefreshTokenHash,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: session.userId,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await prisma.session.updateMany({
      where: {
        refreshTokenHash,
      },
      data: {
        revoked: true,
      },
    });

    return {
      success: true,
    };
  }
}

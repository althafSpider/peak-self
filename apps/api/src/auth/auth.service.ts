import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(MailService) private readonly mailService: MailService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  getAppUrl() {
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) throw new Error('Missing APP_URL');
    return appUrl;
  }

  async requestMagicLink(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    let user = await this.prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: { email: normalizedEmail },
      });
    }

    const existing = await this.prisma.magicLinks.findFirst({
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

    await this.prisma.magicLinks.create({
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
      await this.prisma.magicLinks.deleteMany({
        where: { user_id: user.id },
      });

      throw error;
    }

    return { data: 'Magic link sent' };
  }

async verifyMagicLink(
  token: string,
  meta?: { userAgent?: string; ipAddress?: string },
) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const refreshToken = crypto.randomBytes(48).toString('hex');

  const refreshTokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const refreshExpiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 30,
  );

  const result = await this.prisma.$transaction(
    async (tx) => {
      const claimed = await tx.magicLinks.updateMany({
        where: {
          token_hash: tokenHash,
          expires_at: {
            gt: new Date(),
          },
          used: false,
        },
        data: {
          used: true,
        },
      });

      if (claimed.count === 0) {
        throw new BadRequestException(
          'Invalid or expired token.',
        );
      }

      const link = await tx.magicLinks.findFirst({
        where: {
          token_hash: tokenHash,
        },
        select: {
          user_id: true,
        },
      });

      if (!link) {
        throw new BadRequestException(
          'Invalid or expired token.',
        );
      }

      const session = await tx.session.create({
        data: {
          userId: link.user_id,
          refreshTokenHash,
          userAgent: meta?.userAgent,
          ipAddress: meta?.ipAddress,
          expiresAt: refreshExpiresAt,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      return {
        sessionId: session.id,
        userId: session.userId,
      };
    },
    {
      maxWait: 15000,
      timeout: 15000,
    },
  );

  const accessToken = await this.jwtService.signAsync({
    sub: result.userId,
    sessionId: result.sessionId,
  });

  return {
    accessToken,
    refreshToken,
  };
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

    // Keep the transaction focused on database operations only — no crypto/JWT inside
    const { sessionId, userId } = await this.prisma.$transaction(
      async (tx) => {
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

        return { sessionId: session.id, userId: session.userId };
      },
      {
        maxWait: 10000,
        timeout: 15000,
      },
    );

    // Sign JWT outside the transaction — crypto work should never hold a DB connection
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      sessionId,
    });

    return { accessToken, refreshToken };
  }

  async refreshSession(refreshToken: string) {
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await this.prisma.session.findFirst({
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

    await this.prisma.session.update({
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

  async getUserById(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.prisma.session.updateMany({
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

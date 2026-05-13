import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { prisma } from '@repo/db';
import crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(MailService) private readonly mailService: MailService,
  ) {}

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

    const url = new URL('/auth/verify', process.env.APP_URL);
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
}

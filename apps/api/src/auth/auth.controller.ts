import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Inject,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  accessToken: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  },
  refreshToken: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, COOKIE_OPTIONS.accessToken);
  res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS.refreshToken);
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('request-magic-link')
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Post('verify')
  async verify(
    @Body() dto: VerifyMagicLinkDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyMagicLink(dto.token, {
      userAgent: req.headers?.['user-agent'],
      ipAddress: req.ip,
    });

    setAuthCookies(res, result.accessToken, result.refreshToken);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const result = await this.authService.refreshSession(refreshToken);

    setAuthCookies(res, result.accessToken, result.refreshToken);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    clearAuthCookies(res);

    return { success: true };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {
    return;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res() res: any) {
    const tokens = await this.authService.loginWithGoogle(req.user, {
      userAgent: req.headers?.['user-agent'],
      ipAddress: req.ip,
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Redirect directly to dashboard — cookies carry auth state
    return res.redirect(this.authService.getAppUrl() + '/dashboard');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('userId') userId: string) {
    const user = await this.authService.getUserById(userId);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    };
  }
}

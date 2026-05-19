import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Inject,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('request-magic-link')
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Post('verify')
  async verify(@Body() dto: VerifyMagicLinkDto, @Req() req: any) {
    return this.authService.verifyMagicLink(dto.token, {
      userAgent: req.headers?.['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshSession(dto.refreshToken);
  }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
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

    const url = new URL('/auth/google/callback', this.authService.getAppUrl());
    url.searchParams.set('accessToken', tokens.accessToken);
    url.searchParams.set('refreshToken', tokens.refreshToken);

    return res.redirect(url.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}

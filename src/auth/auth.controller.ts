import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { iniciarSesionDto } from './dtos';
import { registrarUsuarioDto } from './dtos/registrar-usuario.dto';
import { registroCompletoDto } from './dtos/registro-completo.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth/refresh',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async iniciarSesion(
    @Body() dto: iniciarSesionDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.iniciarSesion(dto);

    res.cookie(REFRESH_COOKIE, refresh_token, COOKIE_OPTIONS);

    return { access_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refrescarToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('No se encontró el token de refresco');
    }

    const { access_token, refresh_token } = await this.authService.refrescarToken(refreshToken);

    res.cookie(REFRESH_COOKIE, refresh_token, COOKIE_OPTIONS);

    return { access_token };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async cerrarSesion(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const usuarioId = (req as any).user?.session?.id;
    if (usuarioId) {
      await this.authService.cerrarSesion(usuarioId);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth/refresh' });
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('registrar')
  async registrarUsuario(
    @Body() dto: registrarUsuarioDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.registrarUsuario(dto);

    res.cookie(REFRESH_COOKIE, refresh_token, COOKIE_OPTIONS);

    return { access_token };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('registro-completo')
  async registrarCompleto(
    @Body() dto: registroCompletoDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.registrarCompleto(dto);

    res.cookie(REFRESH_COOKIE, refresh_token, COOKIE_OPTIONS);

    return { access_token };
  }
}

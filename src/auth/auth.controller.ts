import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { iniciarSesionDto } from './dtos';
import { Request } from 'express';

@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  iniciarSesion(@Body() dto: iniciarSesionDto) {
    return this.authService.iniciarSesion(dto);
  }
}

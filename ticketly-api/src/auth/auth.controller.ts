import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { AdminResponseDto } from '../admins/dto/admin-response.dto';
import { Admin } from '../admins/entities/admin.entity';
import { AuthService } from './auth.service';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ status: HttpStatus.OK, type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha inválidos' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ZodResponse({ status: HttpStatus.OK, type: AdminResponseDto })
  @ApiUnauthorizedResponse()
  me(@CurrentAdmin() admin: Admin) {
    return admin;
  }
}

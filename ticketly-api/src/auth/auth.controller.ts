import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { AdminResponseDto } from '../admins/dto/admin-response.dto';
import { Admin } from '../admins/entities/admin.entity';
import { ApiErrors } from '../common/swagger/api-errors.decorator';
import {
  AUTH_GUARD_ERRORS,
  InvalidCredentialsException,
} from './auth.exceptions';
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
  @ApiErrors(HttpStatus.BAD_REQUEST, InvalidCredentialsException)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ZodResponse({ status: HttpStatus.OK, type: AdminResponseDto })
  @ApiErrors(...AUTH_GUARD_ERRORS)
  me(@CurrentAdmin() admin: Admin) {
    return admin;
  }
}

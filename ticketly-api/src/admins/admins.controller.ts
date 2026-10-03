import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { AdminsService } from './admins.service';
import { AdminListResponseDto } from './dto/admin-list-response.dto';
import { AdminResponseDto } from './dto/admin-response.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ListAdminsQueryDto } from './dto/list-admins-query.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('admins')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado' })
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: AdminResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  create(@Body() dto: CreateAdminDto) {
    return this.adminsService.create(dto);
  }

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: AdminListResponseDto })
  findAll(@Query() query: ListAdminsQueryDto) {
    return this.adminsService.findAll(query);
  }

  @Get(':id')
  @ZodResponse({ status: HttpStatus.OK, type: AdminResponseDto })
  @ApiNotFoundResponse({ description: 'Admin não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.findOne(id);
  }

  @Patch(':id')
  @ZodResponse({ status: HttpStatus.OK, type: AdminResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiNotFoundResponse({ description: 'Admin não encontrado' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminDto) {
    return this.adminsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Admin não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.adminsService.remove(id);
  }
}

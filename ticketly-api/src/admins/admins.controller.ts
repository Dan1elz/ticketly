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
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { AUTH_GUARD_ERRORS } from '../auth/auth.exceptions';
import { ApiErrors } from '../common/swagger/api-errors.decorator';
import {
  AdminEmailAlreadyExistsException,
  AdminNotFoundException,
} from './admins.exceptions';
import { AdminsService } from './admins.service';
import { AdminListResponseDto } from './dto/admin-list-response.dto';
import { AdminResponseDto } from './dto/admin-response.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ListAdminsQueryDto } from './dto/list-admins-query.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('admins')
@ApiBearerAuth()
@ApiErrors(...AUTH_GUARD_ERRORS)
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: AdminResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST, AdminEmailAlreadyExistsException)
  create(@Body() dto: CreateAdminDto) {
    return this.adminsService.create(dto);
  }

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: AdminListResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST)
  findAll(@Query() query: ListAdminsQueryDto) {
    return this.adminsService.findAll(query);
  }

  @Get(':id')
  @ZodResponse({ status: HttpStatus.OK, type: AdminResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST, AdminNotFoundException)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.findOne(id);
  }

  @Patch(':id')
  @ZodResponse({ status: HttpStatus.OK, type: AdminResponseDto })
  @ApiErrors(HttpStatus.BAD_REQUEST, AdminNotFoundException)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminDto) {
    return this.adminsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiErrors(HttpStatus.BAD_REQUEST, AdminNotFoundException)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.adminsService.remove(id);
  }
}

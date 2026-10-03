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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminsService } from './admins.service';
import { AdminListResponseDto } from './dto/admin-list-response.dto';
import { AdminResponseDto } from './dto/admin-response.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ListAdminsQueryDto } from './dto/list-admins-query.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('admins')
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  @ApiCreatedResponse({ type: AdminResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  async create(@Body() dto: CreateAdminDto): Promise<AdminResponseDto> {
    const admin = await this.adminsService.create(dto);
    return AdminResponseDto.fromEntity(admin);
  }

  @Get()
  @ApiOkResponse({ type: AdminListResponseDto })
  async findAll(
    @Query() query: ListAdminsQueryDto,
  ): Promise<AdminListResponseDto> {
    const result = await this.adminsService.findAll(query);
    return AdminListResponseDto.fromPaginated(result);
  }

  @Get(':id')
  @ApiOkResponse({ type: AdminResponseDto })
  @ApiNotFoundResponse({ description: 'Admin não encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminResponseDto> {
    const admin = await this.adminsService.findOne(id);
    return AdminResponseDto.fromEntity(admin);
  }

  @Patch(':id')
  @ApiOkResponse({ type: AdminResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiNotFoundResponse({ description: 'Admin não encontrado' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDto,
  ): Promise<AdminResponseDto> {
    const admin = await this.adminsService.update(id, dto);
    return AdminResponseDto.fromEntity(admin);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Admin não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.adminsService.remove(id);
  }
}

import {
  Controller,
  FileTypeValidator,
  HttpStatus,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { AUTH_GUARD_ERRORS } from '../auth/auth.exceptions';
import { ApiErrors } from '../common/swagger/api-errors.decorator';
import { UploadResultDto } from './dto/upload-result.dto';
import { UploadsService } from './uploads.service';
import { MAX_IMAGE_SIZE } from './uploads.types';

const imageFilePipe = new ParseFilePipe({
  validators: [
    new FileTypeValidator({
      fileType: /^image\/(jpeg|png|webp|avif)$/,
      overrideMimeType: true,
      errorMessage: 'Use uma imagem JPG, PNG, WebP ou AVIF',
    }),
  ],
});

@ApiTags('uploads')
@ApiBearerAuth()
@ApiErrors(...AUTH_GUARD_ERRORS)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('artist-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ZodResponse({ status: HttpStatus.CREATED, type: UploadResultDto })
  @ApiErrors(HttpStatus.BAD_REQUEST, {
    error: HttpStatus.PAYLOAD_TOO_LARGE,
    description: 'Arquivo maior que 5 MB',
  })
  uploadArtistImage(@UploadedFile(imageFilePipe) file: Express.Multer.File) {
    return this.uploadsService.uploadPublicImage(file, 'artists');
  }
}

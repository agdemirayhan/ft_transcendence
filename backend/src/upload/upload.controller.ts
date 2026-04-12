import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { Response } from 'express';

const storage = diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/png', 'image/jpeg'];
        if (!allowedMimes.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Only PNG and JPG files are allowed',
            ),
            false,
          );
        } else {
          cb(null, true);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @GetUser('id') userId: number,
    @Query('postId') postId?: string,
  ) {
    const parsedPostId = postId ? parseInt(postId, 10) : undefined;
    return this.uploadService.uploadFile(file, userId, parsedPostId);
  }

  @Get(':fileId')
  async getFile(
    @Param('fileId', ParseIntPipe) fileId: number,
    @Res() res: Response,
  ) {
    const fileData = await this.uploadService.getFile(fileId);
    res.set({
      'Content-Type': fileData.mimetype,
      'Content-Disposition': `inline; filename="${fileData.filename}"`,
    });
    res.send(fileData.data)
    //res.type(fileData.mimetype);
    //res.download(fileData.path, fileData.filename);
  }

  @Delete(':fileId')
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Param('fileId', ParseIntPipe) fileId: number,
    @GetUser('id') userId: number,
  ) {
    return this.uploadService.deleteFile(fileId, userId);
  }
}

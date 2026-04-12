import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: any,
    userId: number,
    postId?: number,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimes = ['image/png', 'image/jpeg'];
    if (!allowedMimes.includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      throw new BadRequestException('Only PNG and JPG files are allowed');
    }

    // Validate file size (optional - max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      fs.unlinkSync(file.path);
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      // Save file record to database
      const fileBuffer = fs.readFileSync(file.path);
      const fileRecord = await this.prisma.file.create({
        data: {
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          data:fileBuffer,
          authorId: userId,
          postId: postId || null,
        },
      });

      return {
        id: fileRecord.id,
        filename: fileRecord.filename,
        mimetype: fileRecord.mimetype,
        size: fileRecord.size,
        url: `/upload/${fileRecord.id}`,
        createdAt: fileRecord.createdAt,
      };
    } catch (error) {
      fs.unlinkSync(file.path);
      throw error;
    }
  }

  async getFile(fileId: number) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    return {
      data: file.data,
      mimetype: file.mimetype,
      filename: file.filename,
    };
  }

  async deleteFile(fileId: number, userId: number) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    if (file.authorId !== userId) {
      throw new BadRequestException('You can only delete your own files');
    }

    // Delete from disk
    const filePath = path.join(this.uploadDir, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    return { message: 'File deleted successfully' };
  }

  getUploadDir() {
    return this.uploadDir;
  }
}

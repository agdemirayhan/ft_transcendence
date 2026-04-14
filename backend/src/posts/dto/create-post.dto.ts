import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  fileId?: number;
}

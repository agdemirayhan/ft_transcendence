import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  fileId?: number;
}

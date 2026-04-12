import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  fileId?: number;
}

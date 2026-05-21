import { ArrayMaxSize, IsArray, IsString } from "class-validator";

export class UpdateBlockersDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  blockers: string[];
}
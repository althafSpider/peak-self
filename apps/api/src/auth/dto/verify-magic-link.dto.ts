import { IsString, MinLength } from "class-validator";

export class VerifyMagicLinkDto {
  @IsString()
  @MinLength(10)
  token!: string;
}


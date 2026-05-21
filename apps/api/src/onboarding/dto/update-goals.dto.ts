import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdateGoalsDto {
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  primaryGoal: string;
}
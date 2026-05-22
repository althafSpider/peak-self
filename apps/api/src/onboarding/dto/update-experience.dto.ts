
import { ExperienceLevel } from "@repo/db";
import { IsEnum } from "class-validator";

export class UpdateExperienceDto {
  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;
}
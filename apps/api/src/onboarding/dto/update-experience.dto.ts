import { ExperienceLevel } from "@peak-self/domain";
import { IsEnum } from "class-validator";

export class UpdateExperienceDto {
  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;
}
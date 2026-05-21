import { IsInt, Max, Min } from "class-validator";

export class UpdateTimeCommitmentDto {
  @IsInt()
  @Min(5)
  @Max(300)
  timeCommitmentMinutes: number;
}
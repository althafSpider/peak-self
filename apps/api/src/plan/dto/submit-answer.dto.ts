import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AIAnswerItemDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  // Keep flexible because AI questions may have
  // text, multiple choice, sliders, etc.
  answer: any;
}

export class SubmitAIAnswersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AIAnswerItemDto)
  answers: AIAnswerItemDto[];
}
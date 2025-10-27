import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessRatingDto } from './create-business-rating.dto';

export class UpdateBusinessRatingDto extends PartialType(CreateBusinessRatingDto) {}

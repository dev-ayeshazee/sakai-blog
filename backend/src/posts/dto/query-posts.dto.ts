import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const POST_SORT_FIELDS = ['publishedAt', 'title', 'author'] as const;
export type PostSortField = (typeof POST_SORT_FIELDS)[number];

export class QueryPostsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 5;

  /** Free-text search across title, body and author name (ILIKE). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  /** Filter by author name (substring, case-insensitive). */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  author?: string;

  /** Filter to posts carrying this exact tag. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  tag?: string;

  @IsOptional()
  @IsIn(POST_SORT_FIELDS)
  sort: PostSortField = 'publishedAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';
}

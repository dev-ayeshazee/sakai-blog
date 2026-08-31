import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/strategies/jwt.strategy';

@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  /** Public. `GET /posts?page=1&pageSize=5` */
  @Get()
  list(@Query() query: QueryPostsDto) {
    return this.posts.findPaginated(query);
  }

  /** Public. */
  @Get(':id')
  detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.posts.findOne(id);
  }

  /** Authenticated. Author is taken from the JWT, never the request body. */
  @HttpPost()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    return this.posts.create(dto, user);
  }
}

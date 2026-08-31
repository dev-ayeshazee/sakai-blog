import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { AiService } from '../ai/ai.service';
import { AuthUser } from '../auth/strategies/jwt.strategy';

export interface PaginatedPosts {
  data: PostListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PostListItem {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  author: { id: string; name: string };
  publishedAt: Date;
}

export interface PostDetail extends PostListItem {
  body: string;
  createdAt: Date;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly posts: Repository<Post>,
    private readonly ai: AiService,
  ) {}

  async findPaginated(query: QueryPostsDto): Promise<PaginatedPosts> {
    const { page, pageSize } = query;
    const [rows, total] = await this.posts.findAndCount({
      order: { publishedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      data: rows.map((p) => this.toListItem(p)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async findOne(id: string): Promise<PostDetail> {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return { ...this.toListItem(post), body: post.body, createdAt: post.createdAt };
  }

  async create(dto: CreatePostDto, author: AuthUser): Promise<PostDetail> {
    // AI middleware: moderate + generate excerpt + suggest tags before save.
    const enrichment = await this.ai.enrichPost(dto.body);
    if (enrichment.moderation.flagged) {
      throw new UnprocessableEntityException({
        message: 'Post content was flagged by moderation',
        reasons: enrichment.moderation.reasons,
      });
    }

    const entity = this.posts.create({
      title: dto.title.trim(),
      body: dto.body,
      excerpt: enrichment.excerpt,
      tags: enrichment.tags,
      authorId: author.id,
      publishedAt: new Date(),
    });
    const saved = await this.posts.save(entity);
    // Re-read to hydrate the eager author relation.
    return this.findOne(saved.id);
  }

  private toListItem(p: Post): PostListItem {
    return {
      id: p.id,
      title: p.title,
      excerpt: p.excerpt,
      tags: p.tags ?? [],
      author: { id: p.authorId, name: p.author?.name ?? 'Unknown' },
      publishedAt: p.publishedAt,
    };
  }
}

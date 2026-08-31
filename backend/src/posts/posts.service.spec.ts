import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnprocessableEntityException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { AiService } from '../ai/ai.service';

const author = { id: 'a1', email: 'a@b.com', name: 'Author' };

describe('PostsService.create', () => {
  let service: PostsService;
  let repo: any;
  let ai: jest.Mocked<Pick<AiService, 'enrichPost'>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ ...x, id: 'p1' })),
      findOne: jest.fn(async () => ({
        id: 'p1',
        title: 'T',
        body: 'B',
        excerpt: 'E',
        tags: ['t'],
        authorId: author.id,
        author: { id: author.id, name: author.name },
        publishedAt: new Date(),
        createdAt: new Date(),
      })),
    };
    ai = { enrichPost: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: repo },
        { provide: AiService, useValue: ai },
      ],
    }).compile();
    service = moduleRef.get(PostsService);
  });

  it('persists AI-generated excerpt + tags and the JWT author id', async () => {
    ai.enrichPost.mockResolvedValue({
      excerpt: 'auto excerpt',
      tags: ['angular', 'nestjs'],
      moderation: { flagged: false, reasons: [] },
    });

    await service.create(
      { title: 'Hello world', body: 'a'.repeat(50) },
      author,
    );

    const saved = repo.create.mock.calls[0][0];
    expect(saved.excerpt).toBe('auto excerpt');
    expect(saved.tags).toEqual(['angular', 'nestjs']);
    expect(saved.authorId).toBe('a1');
  });

  it('rejects content flagged by moderation with 422', async () => {
    ai.enrichPost.mockResolvedValue({
      excerpt: '',
      tags: [],
      moderation: { flagged: true, reasons: ['banned phrase'] },
    });

    await expect(
      service.create({ title: 'Bad', body: 'x'.repeat(50) }, author),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

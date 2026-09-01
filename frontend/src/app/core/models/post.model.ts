export interface PostAuthor {
  id: string;
  name: string;
}

export interface PostListItem {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  author: PostAuthor;
  publishedAt: string;
}

export interface PostDetail extends PostListItem {
  body: string;
  createdAt: string;
}

export interface PaginatedPosts {
  data: PostListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePostPayload {
  title: string;
  body: string;
}

export type PostSortField = 'publishedAt' | 'title' | 'author';

export interface PostListQuery {
  page: number;
  pageSize?: number;
  search?: string;
  author?: string;
  tag?: string;
  sort?: PostSortField;
  order?: 'ASC' | 'DESC';
}

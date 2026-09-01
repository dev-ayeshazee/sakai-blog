import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CreatePostPayload,
  PaginatedPosts,
  PostDetail,
  PostListQuery,
} from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly api = `${environment.apiUrl}/posts`;

  constructor(private readonly http: HttpClient) {}

  list(query: PostListQuery): Observable<PaginatedPosts> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize ?? 5);

    if (query.search) params = params.set('search', query.search);
    if (query.author) params = params.set('author', query.author);
    if (query.tag) params = params.set('tag', query.tag);
    if (query.sort) params = params.set('sort', query.sort);
    if (query.order) params = params.set('order', query.order);

    return this.http.get<PaginatedPosts>(this.api, { params });
  }

  getById(id: string): Observable<PostDetail> {
    return this.http.get<PostDetail>(`${this.api}/${id}`);
  }

  create(payload: CreatePostPayload): Observable<PostDetail> {
    return this.http.post<PostDetail>(this.api, payload);
  }
}

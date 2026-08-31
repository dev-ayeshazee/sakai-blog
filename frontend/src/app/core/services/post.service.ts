import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CreatePostPayload,
  PaginatedPosts,
  PostDetail,
} from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly api = `${environment.apiUrl}/posts`;

  constructor(private readonly http: HttpClient) {}

  list(page: number, pageSize = 5): Observable<PaginatedPosts> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<PaginatedPosts>(this.api, { params });
  }

  getById(id: string): Observable<PostDetail> {
    return this.http.get<PostDetail>(`${this.api}/${id}`);
  }

  create(payload: CreatePostPayload): Observable<PostDetail> {
    return this.http.post<PostDetail>(this.api, payload);
  }
}

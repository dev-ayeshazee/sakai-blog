import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { PostDetail } from '../../core/models/post.model';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
})
export class PostDetailComponent implements OnInit {
  post?: PostDetail;
  loading = true;
  error?: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly posts: PostService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Missing post id';
      this.loading = false;
      return;
    }
    this.posts.getById(id).subscribe({
      next: (post) => {
        this.post = post;
        this.loading = false;
      },
      error: (err) => {
        this.error =
          err?.status === 404 ? 'Post not found.' : 'Failed to load post.';
        this.loading = false;
      },
    });
  }
}

import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';
import { PostDetail } from '../../core/models/post.model';

type Phase = 'editing' | 'publishing' | 'published';

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.component.html',
  providers: [MessageService],
})
export class CreatePostComponent {
  phase: Phase = 'editing';

  /** Optimistic preview shown the instant the user hits Publish. */
  optimistic?: { title: string; body: string };
  published?: PostDetail;

  readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(20000)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly posts: PostService,
    private readonly router: Router,
    private readonly messages: MessageService,
    readonly auth: AuthService,
  ) {}

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue() as { title: string; body: string };

    // --- Optimistic update: render the result before the server confirms.
    this.optimistic = { ...payload };
    this.phase = 'publishing';
    this.form.disable();

    this.posts
      .create(payload)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (post) => {
          this.published = post;
          this.phase = 'published';
          this.messages.add({
            severity: 'success',
            summary: 'Published',
            detail: 'Your post is live.',
          });
        },
        error: (err) => {
          // --- Rollback.
          this.phase = 'editing';
          this.optimistic = undefined;
          this.form.enable();
          const detail =
            err?.error?.message ??
            (err?.status === 401
              ? 'Your session expired — please log in again.'
              : 'Could not publish the post. Please try again.');
          this.messages.add({
            severity: 'error',
            summary: 'Publish failed',
            detail: Array.isArray(detail) ? detail.join(', ') : detail,
          });
        },
      });
  }

  viewPost(): void {
    if (this.published) this.router.navigate(['/posts', this.published.id]);
  }

  writeAnother(): void {
    this.published = undefined;
    this.optimistic = undefined;
    this.phase = 'editing';
    this.form.reset();
    this.form.enable();
  }
}

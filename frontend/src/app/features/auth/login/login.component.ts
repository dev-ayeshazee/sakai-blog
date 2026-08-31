import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  providers: [MessageService],
})
export class LoginComponent {
  loading = false;
  private readonly returnUrl: string;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(1)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    route: ActivatedRoute,
    private readonly messages: MessageService,
  ) {
    this.returnUrl = route.snapshot.queryParamMap.get('returnUrl') || '/';
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth
      .login(this.form.getRawValue() as { email: string; password: string })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigateByUrl(this.returnUrl),
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Login failed',
            detail: err?.error?.message ?? 'Invalid email or password.',
          }),
      });
  }
}

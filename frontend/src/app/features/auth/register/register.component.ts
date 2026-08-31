import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  providers: [MessageService],
})
export class RegisterComponent {
  loading = false;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly messages: MessageService,
  ) {}

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
      .register(
        this.form.getRawValue() as {
          name: string;
          email: string;
          password: string;
        },
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Registration failed',
            detail: Array.isArray(err?.error?.message)
              ? err.error.message.join(', ')
              : err?.error?.message ?? 'Could not create the account.',
          }),
      });
  }
}

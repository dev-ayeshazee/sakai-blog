import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  AuthResult,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '../models/auth.model';

const TOKEN_KEY = 'blog.token';
const USER_KEY = 'blog.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;

  /** Reactive session state consumed by the navbar and guards. */
  private readonly _user = signal<AuthUser | null>(this.readStoredUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor(private readonly http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(payload: LoginPayload): Observable<AuthResult> {
    return this.http
      .post<AuthResult>(`${this.api}/login`, payload)
      .pipe(tap((res) => this.persist(res)));
  }

  register(payload: RegisterPayload): Observable<AuthResult> {
    return this.http
      .post<AuthResult>(`${this.api}/register`, payload)
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  private persist(res: AuthResult): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private readStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}

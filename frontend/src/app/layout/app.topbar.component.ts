import { Component, ElementRef, ViewChild, computed } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { LayoutService } from './service/app.layout.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './app.topbar.component.html',
})
export class AppTopBarComponent {
  @ViewChild('menubutton') menuButton!: ElementRef;
  @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
  @ViewChild('topbarmenu') menu!: ElementRef;

  /** Profile dropdown shown after login. */
  readonly profileMenu = computed<MenuItem[]>(() => {
    const user = this.auth.user();
    return [
      {
        label: user?.name ?? 'Account',
        items: [
          {
            label: 'New post',
            icon: 'pi pi-pencil',
            command: () => this.router.navigate(['/create']),
          },
          {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => this.logout(),
          },
        ],
      },
    ];
  });

  constructor(
    public layoutService: LayoutService,
    public auth: AuthService,
    private router: Router,
  ) {}

  get initials(): string {
    const name = this.auth.user()?.name?.trim() ?? '';
    return (
      name
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U'
    );
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}

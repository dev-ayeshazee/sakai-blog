import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';

@Component({
  selector: 'app-menu',
  templateUrl: './app.menu.component.html',
})
export class AppMenuComponent implements OnInit {
  model: any[] = [];

  constructor(public layoutService: LayoutService) {}

  ngOnInit() {
    this.model = [
      {
        label: 'Blog',
        items: [
          { label: 'Home', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
          // Protected by authGuard — anonymous clicks are bounced to login.
          { label: 'New Post', icon: 'pi pi-fw pi-pencil', routerLink: ['/create'] },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Login', icon: 'pi pi-fw pi-sign-in', routerLink: ['/auth/login'] },
          { label: 'Register', icon: 'pi pi-fw pi-user-plus', routerLink: ['/auth/register'] },
        ],
      },
    ];
  }
}

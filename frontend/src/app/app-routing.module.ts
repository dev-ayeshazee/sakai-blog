import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './demo/components/notfound/notfound.component';
import { AppLayoutComponent } from './layout/app.layout.component';
import { authGuard } from './core/guards/auth.guard';

@NgModule({
  imports: [
    RouterModule.forRoot(
      [
        {
          path: '',
          component: AppLayoutComponent,
          children: [
            {
              path: '',
              loadChildren: () =>
                import('./features/home/home.module').then((m) => m.HomeModule),
            },
            {
              path: 'posts/:id',
              loadChildren: () =>
                import('./features/post-detail/post-detail.module').then(
                  (m) => m.PostDetailModule,
                ),
            },
            {
              path: 'create',
              canActivate: [authGuard],
              loadChildren: () =>
                import('./features/create-post/create-post.module').then(
                  (m) => m.CreatePostModule,
                ),
            },
          ],
        },
        {
          path: 'auth',
          loadChildren: () =>
            import('./features/auth/auth.module').then((m) => m.AuthModule),
        },
        { path: 'notfound', component: NotfoundComponent },
        { path: '**', redirectTo: '/notfound' },
      ],
      {
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
        onSameUrlNavigation: 'reload',
      },
    ),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}

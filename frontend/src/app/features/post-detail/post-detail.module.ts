import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { PostDetailComponent } from './post-detail.component';

const routes: Routes = [{ path: '', component: PostDetailComponent }];

@NgModule({
  declarations: [PostDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ProgressSpinnerModule,
    MessageModule,
    DividerModule,
    TagModule,
  ],
})
export class PostDetailModule {}

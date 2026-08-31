import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { CreatePostComponent } from './create-post.component';

const routes: Routes = [{ path: '', component: CreatePostComponent }];

@NgModule({
  declarations: [CreatePostComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    ToastModule,
    DividerModule,
    TagModule,
  ],
})
export class CreatePostModule {}

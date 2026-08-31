import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  /** Auto-generated (first ~200 chars / AI summary) at creation time. */
  @Column({ type: 'varchar', length: 220 })
  excerpt: string;

  /** AI-suggested topic tags, generated at creation time. */
  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Index()
  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Index()
  @Column({ name: 'published_at', type: 'timestamptz' })
  publishedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

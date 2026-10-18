export interface StudyCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  description?: string;
  icon?: string;
}

export interface StudyArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string; // 카테고리 id (동적 할당 가능)
  categoryName?: string;
  author: string;
  views: number;
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  thumbnail?: string;
  isPublished: boolean;
}

export interface StudyComment {
  id: string;
  articleId: string;
  authorName: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface StudyArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: 'saju_basics' | 'ten_gods' | 'fortune_flow' | 'qna_community';
  author: string;
  views: number;
  commentsCount: number;
  createdAt: string;
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

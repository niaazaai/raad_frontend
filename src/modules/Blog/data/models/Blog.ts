import * as z from "zod";

export enum BlogStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PUBLISHED = "published",
}

export enum BlogCategory {
  FINANCE = "finance",
  ACCOUNTING = "accounting",
  EDUCATION = "education",
  CAREER = "career",
  NEWS = "news",
  OTHER = "other",
}

export enum BlogLanguage {
  EN = "en",
  PS = "ps",
  DR = "dr",
}

export const BlogStatusDisplayLabels: Record<BlogStatus, string> = {
  [BlogStatus.ACTIVE]: "Active",
  [BlogStatus.INACTIVE]: "Inactive",
  [BlogStatus.PUBLISHED]: "Published",
};

export const BlogCategoryLabels: Record<BlogCategory, string> = {
  [BlogCategory.FINANCE]: "Finance",
  [BlogCategory.ACCOUNTING]: "Accounting",
  [BlogCategory.EDUCATION]: "Education",
  [BlogCategory.CAREER]: "Career",
  [BlogCategory.NEWS]: "News",
  [BlogCategory.OTHER]: "Other",
};

export const BlogLanguageLabels: Record<BlogLanguage, string> = {
  [BlogLanguage.EN]: "English",
  [BlogLanguage.PS]: "Pashto",
  [BlogLanguage.DR]: "Dari",
};

export const BlogSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  image_url: z.string().nullable().optional(),
  image_signed_url: z.string().nullable().optional(),
  author: z.string(),
  author_id: z.number().nullable().optional(),
  author_name: z.string().nullable().optional(),
  category: z.nativeEnum(BlogCategory),
  category_label: z.string().optional(),
  status: z.nativeEnum(BlogStatus),
  status_label: z.string().optional(),
  language: z.nativeEnum(BlogLanguage),
  language_label: z.string().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  meta_keywords: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Blog = z.infer<typeof BlogSchema>;

export const CreateBlogSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required").max(50000),
  category: z.nativeEnum(BlogCategory),
  status: z.nativeEnum(BlogStatus).optional(),
  language: z.nativeEnum(BlogLanguage).optional(),
  meta_keywords: z.string().max(500).optional(),
});

export type CreateBlogData = z.infer<typeof CreateBlogSchema>;

export const UpdateBlogSchema = CreateBlogSchema.partial();
export type UpdateBlogData = z.infer<typeof UpdateBlogSchema>;

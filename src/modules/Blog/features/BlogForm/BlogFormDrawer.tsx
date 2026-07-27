import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDisk } from "iconoir-react";
import {
  Button,
  ImageDropzone,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  Label,
  Input,
} from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useCreateBlog, useUpdateBlog } from "../../hooks";
import {
  BlogCategory,
  BlogCategoryLabels,
  BlogLanguage,
  BlogLanguageLabels,
  BlogStatus,
  CreateBlogSchema,
  type Blog,
  type CreateBlogData,
} from "../../data/models";

interface BlogFormDrawerProps {
  blog: Blog | null;
  onSuccess: () => void;
}

const BlogFormDrawer = ({ blog, onSuccess }: BlogFormDrawerProps) => {
  const isEdit = !!blog;
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { mutate: createBlog, isPending: isCreating } = useCreateBlog();
  const { mutate: updateBlog, isPending: isUpdating } = useUpdateBlog(blog?.id ?? 0);
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBlogData>({
    resolver: zodResolver(CreateBlogSchema),
    defaultValues: {
      title: "",
      description: "",
      category: BlogCategory.FINANCE,
      status: BlogStatus.ACTIVE,
      language: BlogLanguage.EN,
      meta_keywords: "",
    },
  });

  useEffect(() => {
    if (blog) {
      reset({
        title: blog.title,
        description: blog.description,
        category: blog.category,
        status: blog.status,
        language: blog.language,
        meta_keywords: blog.meta_keywords ?? "",
      });
    } else {
      reset({
        title: "",
        description: "",
        category: BlogCategory.FINANCE,
        status: BlogStatus.ACTIVE,
        language: BlogLanguage.EN,
        meta_keywords: "",
      });
      setImageFile(null);
    }
  }, [blog, reset]);

  const onSubmit = (data: CreateBlogData) => {
    const payload: Record<string, unknown> = { ...data };
    delete payload.author;
    if (imageFile) payload.image_file = imageFile;

    if (isEdit) {
      updateBlog(payload, { onSuccess: () => onSuccess() });
    } else {
      createBlog(payload, { onSuccess: () => onSuccess() });
    }
  };

  const authorLabel = isEdit
    ? (blog?.author_name ?? blog?.author ?? "—")
    : (user?.name ?? `User #${user?.id ?? ""}`);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
      <DrawerHeader>
        <DrawerTitle>{isEdit ? "Edit Blog" : "Create Blog"}</DrawerTitle>
        <DrawerDescription>
          {isEdit
            ? "Update blog post details."
            : "Add a new blog post. Author is set to the signed-in user. Meta title and description are auto-generated."}
        </DrawerDescription>
      </DrawerHeader>

      <DrawerBody className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-danger">*</span>
          </Label>
          <Input id="title" {...register("title")} />
          {errors.title ? <p className="text-sm text-danger">{errors.title.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-danger">*</span>
          </Label>
          <textarea
            id="description"
            rows={6}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("description")}
          />
          {errors.description ? <p className="text-sm text-danger">{errors.description.message}</p> : null}
        </div>

        <ImageDropzone
          accept="image/*"
          label="Cover image"
          hint="PNG, JPG up to 5MB"
          value={imageFile}
          onSelect={setImageFile}
          initialPreviewUrl={blog?.image_signed_url ?? blog?.image_url ?? null}
        />

        <div className="space-y-2">
          <Label>Author</Label>
          <Input value={authorLabel} disabled readOnly />
          <p className="text-xs text-muted-foreground">
            Automatically set to the creating user{user?.id ? ` (ID ${isEdit ? blog?.author_id ?? blog?.author : user.id})` : ""}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("category")}
            >
              {Object.values(BlogCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {BlogCategoryLabels[cat]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("language")}
            >
              {Object.values(BlogLanguage).map((lang) => (
                <option key={lang} value={lang}>
                  {BlogLanguageLabels[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("status")}
          >
            {Object.values(BlogStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_keywords">Meta keywords</Label>
          <Input id="meta_keywords" placeholder="comma, separated, keywords" {...register("meta_keywords")} />
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button type="submit" loading={isSubmitting}>
          <FloppyDisk className="h-4 w-4" />
          {isEdit ? "Save changes" : "Create blog"}
        </Button>
      </DrawerFooter>
    </form>
  );
};

export default BlogFormDrawer;

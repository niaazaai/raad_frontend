import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save as FloppyDisk } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TagInput,
} from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { useCreateBlog, useDeleteBlogCategory, useSaveBlogCategory, useUpdateBlog } from "../../hooks";
import {
  BlogCategory,
  BlogLanguage,
  BlogStatus,
  CreateBlogSchema,
  type Blog,
  type CreateBlogData,
} from "../../data/models";

interface BlogFormDrawerProps {
  blog: Blog | null;
  savedCategories?: string[];
  onSuccess: () => void;
}

const PRESET_CATEGORIES = (Object.values(BlogCategory) as string[]).filter(
  (category) => category !== BlogCategory.OTHER
);

function splitKeywords(raw: string | null | undefined): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of (raw ?? "").split(",")) {
    const tag = part.trim();
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

const BlogFormDrawer = ({ blog, savedCategories = [], onSuccess }: BlogFormDrawerProps) => {
  const isEdit = !!blog;
  const { t } = useTranslation();
  const { user, hasPermission } = useAuth();
  const canDeleteCategory = hasPermission("blogs.categories.delete");
  const canCreateCategory = hasPermission("blogs.categories.create");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoryChoice, setCategoryChoice] = useState<string>(BlogCategory.FINANCE);
  const [customCategory, setCustomCategory] = useState("");
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const keywordsRef = useRef<string[]>([]);
  const { mutate: createBlog, isPending: isCreating } = useCreateBlog();
  const { mutate: updateBlog, isPending: isUpdating } = useUpdateBlog(blog?.id ?? 0);
  const { mutateAsync: saveCategory } = useSaveBlogCategory();
  const { mutateAsync: removeCategory } = useDeleteBlogCategory();
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    clearErrors,
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
    const category = blog?.category ?? BlogCategory.FINANCE;
    const choice = category.trim() === "" || category.toLowerCase() === "other"
      ? BlogCategory.OTHER
      : category;
    setCategoryChoice(choice);
    setCustomCategory("");
    const nextKeywords = splitKeywords(blog?.meta_keywords);
    keywordsRef.current = nextKeywords;
    setKeywords(nextKeywords);
    if (blog) {
      reset({
        title: blog.title,
        description: blog.description,
        category: choice === BlogCategory.OTHER ? BlogCategory.FINANCE : choice,
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

  const categoryOptions = useMemo(() => {
    const hidden = new Set(hiddenCategories);
    const visible = (category: string) => {
      const name = category.trim();
      return name !== "" && name.toLowerCase() !== "other" && !hidden.has(name.toLowerCase());
    };
    const fromSaved = savedCategories.filter(visible);
    const base = fromSaved.length > 0 ? fromSaved : PRESET_CATEGORIES.filter(visible);
    const extras = [...base];
    for (const category of addedCategories) {
      if (visible(category) && !extras.includes(category)) extras.push(category);
    }
    if (blog && visible(blog.category) && !extras.includes(blog.category)) {
      extras.push(blog.category);
    }
    return [...new Set(extras)];
  }, [savedCategories, hiddenCategories, addedCategories, blog]);

  const handleRemoveCategory = async (value: string) => {
    try {
      await removeCategory(value);
      setHiddenCategories((current) =>
        current.includes(value.toLowerCase()) ? current : [...current, value.toLowerCase()]
      );
      setAddedCategories((current) => current.filter((category) => category !== value));
      if (categoryChoice === value) {
        const next = categoryOptions.find((category) => category !== value);
        setCategoryChoice(next ?? BlogCategory.OTHER);
      }
    } catch {
      // The request layer already shows the in-use or permission message.
    }
  };

  const commitCustomCategory = async () => {
    const name = customCategory.trim();
    if (!name || name.toLowerCase() === "other" || !canCreateCategory) return;
    try {
      const value = await saveCategory(name);
      setHiddenCategories((current) => current.filter((item) => item !== value.toLowerCase()));
      setAddedCategories((current) => (current.includes(value) ? current : [...current, value]));
      setCategoryChoice(value);
      setCustomCategory("");
      clearErrors("category");
    } catch {
      // The request layer already shows the validation message.
    }
  };

  const onSubmit = (data: CreateBlogData) => {
    const category =
      categoryChoice === BlogCategory.OTHER ? customCategory.trim() : categoryChoice.trim();
    if (!category || category.toLowerCase() === "other") {
      setError("category", { message: t("blogs.customCategoryRequired") });
      return;
    }
    const metaKeywords = keywordsRef.current.join(", ");
    if (metaKeywords.length > 500) {
      setError("meta_keywords", { message: "Keywords must be 500 characters or fewer." });
      return;
    }

    const payload: Record<string, unknown> = {
      ...data,
      category,
      meta_keywords: metaKeywords,
      status: isEdit ? data.status ?? blog?.status ?? BlogStatus.ACTIVE : BlogStatus.ACTIVE,
    };
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

  const categoryLabel = (value: string) => {
    if (value === BlogCategory.FINANCE) return t("blogs.categories.finance");
    if (value === BlogCategory.ACCOUNTING) return t("blogs.categories.accounting");
    if (value === BlogCategory.EDUCATION) return t("blogs.categories.education");
    if (value === BlogCategory.CAREER) return t("blogs.categories.career");
    if (value === BlogCategory.NEWS) return t("blogs.categories.news");
    if (value === BlogCategory.OTHER) return t("blogs.categories.other");
    return value;
  };

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
            Automatically set to the creating user.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">{t("blogs.category")}</Label>
            <Select
              value={categoryChoice}
              onValueChange={(value) => {
                setCategoryChoice(value);
                clearErrors("category");
                if (value !== BlogCategory.OTHER) setCustomCategory("");
              }}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder={t("blogs.category")} />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem
                    key={category}
                    value={category}
                    onRemove={canDeleteCategory ? () => void handleRemoveCategory(category) : undefined}
                    removeLabel={t("blogs.removeCategory")}
                  >
                    {categoryLabel(category)}
                  </SelectItem>
                ))}
                <SelectItem value={BlogCategory.OTHER}>{t("blogs.categories.other")}</SelectItem>
              </SelectContent>
            </Select>
            {categoryChoice === BlogCategory.OTHER ? (
              <Input
                id="custom-category"
                value={customCategory}
                onChange={(event) => {
                  setCustomCategory(event.target.value);
                  clearErrors("category");
                }}
                onBlur={() => {
                  void commitCustomCategory();
                }}
                placeholder={t("blogs.customCategoryPlaceholder")}
                aria-label={t("blogs.customCategory")}
                maxLength={80}
              />
            ) : null}
            {errors.category ? <p className="text-sm text-danger">{errors.category.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">{t("blogs.language")}</Label>
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? BlogLanguage.EN} onValueChange={field.onChange}>
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BlogLanguage.EN}>{t("blogs.languages.en")}</SelectItem>
                    <SelectItem value={BlogLanguage.PS}>{t("blogs.languages.ps")}</SelectItem>
                    <SelectItem value={BlogLanguage.DR}>{t("blogs.languages.dr")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {isEdit ? (
          <div className="space-y-2">
            <Label htmlFor="status">{t("common.status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? BlogStatus.ACTIVE} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BlogStatus.ACTIVE}>{t("blogs.statuses.active")}</SelectItem>
                    <SelectItem value={BlogStatus.INACTIVE}>{t("blogs.statuses.inactive")}</SelectItem>
                    <SelectItem value={BlogStatus.PUBLISHED}>{t("blogs.statuses.published")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="meta_keywords">{t("blogs.keywords")}</Label>
          <TagInput
            id="meta_keywords"
            value={keywords}
            onChange={(tags) => {
              keywordsRef.current = tags;
              setKeywords(tags);
              clearErrors("meta_keywords");
            }}
            placeholder={t("blogs.keywordsPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("blogs.keywordsHint")}</p>
          {errors.meta_keywords ? (
            <p className="text-sm text-danger">{errors.meta_keywords.message}</p>
          ) : null}
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

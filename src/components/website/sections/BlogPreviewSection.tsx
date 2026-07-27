import { useMemo } from "react";
import { Link } from "react-router-dom";
import { NavArrowRight } from "iconoir-react";
import ScrollReveal from "@/components/website/ScrollReveal";
import { Spinner } from "@/components/ui/spinner";
import { usePublicBlogs, getPublicListFromResponse } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import type { PublicBlog } from "@/hooks";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSurface,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

const BlogPreviewSection = () => {
  const { t } = useTranslation();
  const { data, isLoading } = usePublicBlogs({ per_page: 4, page: 1 });
  const blogs = useMemo(() => getPublicListFromResponse<PublicBlog>(data).slice(0, 4), [data]);

  return (
    <section id="blog" className={`${sectionShellClass} ${sectionSurface.card}`}>
      <div className={sectionInnerClass}>
        <ScrollReveal className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className={sectionBadgeClass}>{t("blog.badge")}</span>
            <h2 className={`${sectionTitleClass} mt-3`}>{t("blog.title")}</h2>
            <p className={sectionSubtitleClass}>{t("blog.subtitle")}</p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            {t("blog.viewAll")}
            <NavArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : blogs.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t("blog.empty")}</p>
        ) : (
          <ScrollReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                to={`/blog/${blog.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  {blog.image_signed_url || blog.image_url ? (
                    <img
                      src={blog.image_signed_url ?? blog.image_url ?? ""}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">R</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-medium text-primary">{blog.author_name ?? blog.author}</p>
                  <h3 className="mt-1 line-clamp-2 text-base font-semibold text-foreground">{blog.title}</h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{blog.description}</p>
                </div>
              </Link>
            ))}
          </ScrollReveal>
        )}
      </div>
    </section>
  );
};

export default BlogPreviewSection;

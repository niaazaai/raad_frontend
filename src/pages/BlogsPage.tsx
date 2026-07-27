import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import ScrollReveal from "@/components/website/ScrollReveal";
import { Spinner } from "@/components/ui/spinner";
import { usePublicBlogs, getPublicListFromResponse } from "@/hooks";
import type { PublicBlog } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import {
  sectionBadgeClass,
  sectionInnerClass,
  sectionShellClass,
  sectionSubtitleClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

const BlogsPage = () => {
  const loginHref = resolveLoginHref();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePublicBlogs({ page, per_page: 12 });
  const blogs = useMemo(() => getPublicListFromResponse<PublicBlog>(data), [data]);

  return (
    <>
      <LandingNavbar loginHref={loginHref} />

      <section className={`${sectionShellClass} pt-28 md:pt-32`}>
        <div className={`${sectionInnerClass} text-center`}>
          <span className={sectionBadgeClass}>{t("blog.badge")}</span>
          <h1 className={`${sectionTitleClass} mt-3`}>{t("blog.pageTitle")}</h1>
          <p className={`${sectionSubtitleClass} mx-auto`}>{t("blog.subtitle")}</p>
        </div>
      </section>

      <section className={`${sectionShellClass} border-t border-border/60`}>
        <div className={sectionInnerClass}>
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Spinner className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : blogs.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{t("blog.empty")}</p>
          ) : (
            <ScrollReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  to={`/blog/${blog.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    {blog.image_signed_url || blog.image_url ? (
                      <img src={blog.image_signed_url ?? blog.image_url ?? ""} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-primary/10 text-3xl font-bold text-primary">R</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-medium text-primary">{blog.author_name ?? blog.author}</p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">{blog.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{blog.description}</p>
                  </div>
                </Link>
              ))}
            </ScrollReveal>
          )}

          {blogs.length >= 12 ? (
            <div className="mt-10 flex justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50"
              >
                {t("explore.previous")}
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                {t("explore.next")}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <WebsiteFooter />
    </>
  );
};

export default BlogsPage;

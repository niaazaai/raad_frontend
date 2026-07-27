import { Link, useParams } from "react-router-dom";
import { NavArrowLeft } from "iconoir-react";
import LandingNavbar from "@/components/website/LandingNavbar";
import WebsiteFooter from "@/components/website/WebsiteFooter";
import { Spinner } from "@/components/ui/spinner";
import { usePublicBlog, getPublicItemFromResponse } from "@/hooks";
import type { PublicBlog } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import {
  sectionInnerClass,
  sectionShellClass,
  sectionTitleClass,
} from "@/components/website/websiteData";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

const BlogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const blogId = Number(id);
  const loginHref = resolveLoginHref();
  const { t } = useTranslation();
  const { data, isLoading } = usePublicBlog(blogId);
  const blog = getPublicItemFromResponse<PublicBlog>(data);

  return (
    <>
      <LandingNavbar loginHref={loginHref} />

      <article className={`${sectionShellClass} pt-28 md:pt-32`}>
        <div className={`${sectionInnerClass} max-w-3xl`}>
          <Link to="/blog" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
            <NavArrowLeft className="h-4 w-4" />
            {t("blog.backToList")}
          </Link>

          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Spinner className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : !blog ? (
            <p className="text-muted-foreground">{t("blog.notFound")}</p>
          ) : (
            <>
              {(blog.image_signed_url || blog.image_url) ? (
                <img
                  src={blog.image_signed_url ?? blog.image_url ?? ""}
                  alt=""
                  className="mb-8 aspect-[21/9] w-full rounded-2xl object-cover"
                />
              ) : null}
              <p className="text-sm font-medium text-primary">{blog.author}</p>
              <h1 className={`${sectionTitleClass} mt-2 text-3xl md:text-4xl`}>{blog.title}</h1>
              <div className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground md:text-base">
                {blog.description}
              </div>
            </>
          )}
        </div>
      </article>

      <WebsiteFooter />
    </>
  );
};

export default BlogDetailPage;

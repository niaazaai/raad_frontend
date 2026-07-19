import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";

export interface PermissionDeniedCardProps {
  title?: string;
  description?: string;
  homeHref?: string;
}

/**
 * Single, consistent “no permission” state for protected pages and features.
 */
const PermissionDeniedCard = memo(({ title, description, homeHref = "/dashboard" }: PermissionDeniedCardProps) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("permissionDenied.title");
  const resolvedDescription = description ?? t("permissionDenied.description");

  return (
    <div className="flex min-h-[420px] items-center justify-center p-6">
      <Card className="max-w-md border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-card dark:border-amber-900/50 dark:from-amber-950/30 dark:to-card">
        <CardHeader className="text-center">
          <div className="text-muted-foreground mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-200">
            !
          </div>
          <CardTitle className="text-xl">{resolvedTitle}</CardTitle>
          <CardDescription className="text-base leading-relaxed">{resolvedDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild variant="default">
            <Link to={homeHref}>{t("breadcrumb.dashboard")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

PermissionDeniedCard.displayName = "PermissionDeniedCard";

export default PermissionDeniedCard;

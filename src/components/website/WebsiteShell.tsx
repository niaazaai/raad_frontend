import { useEffect, type ReactNode } from "react";
import SmoothScrollProvider from "@/components/website/SmoothScrollProvider";
import { applyAdminDocumentDefaults, getWebsiteLocaleAttributes, useLocaleStore } from "@/store/locale/localeStore";
import { cn } from "@/lib/utils";

interface WebsiteShellProps {
  children: ReactNode;
  className?: string;
}

const WebsiteShell = ({ children, className }: WebsiteShellProps) => {
  const locale = useLocaleStore((s) => s.locale);
  const { lang, dir } = getWebsiteLocaleAttributes(locale);

  useEffect(() => {
    document.documentElement.classList.add("website-locale-active");
    return () => {
      applyAdminDocumentDefaults();
    };
  }, []);

  return (
    <SmoothScrollProvider>
      <div
        lang={lang}
        dir={dir}
        data-locale={locale}
        className={cn(
          "website-shell min-h-screen scroll-smooth bg-background text-foreground antialiased",
          dir === "rtl" ? "font-[Vazirmatn,Inter,system-ui,sans-serif]" : "font-[Inter,system-ui,sans-serif]",
          className,
        )}
      >
        {children}
      </div>
    </SmoothScrollProvider>
  );
};

export default WebsiteShell;

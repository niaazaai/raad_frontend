import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import WebsiteShell from "@/components/website/WebsiteShell";

/**
 * Single shell for all public marketing pages so Lenis / ScrollTrigger / locale
 * state survive client-side navigations (e.g. landing ↔ qualifications).
 */
const PublicWebsiteLayout = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return (
    <WebsiteShell>
      <Outlet />
    </WebsiteShell>
  );
};

export default PublicWebsiteLayout;

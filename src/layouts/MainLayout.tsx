import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useLayoutStore } from "@/store";
import { useLocaleStore, applyAdminLocale } from "@/store/locale/localeStore";
import { cn } from "@/lib/utils";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

const MainLayout = () => {
  const { sidebarCollapsed } = useLayoutStore();
  const locale = useLocaleStore((s) => s.locale);

  // Keep <html lang/dir> in sync with the selected admin language so the
  // entire dashboard (and portalled drawers/toasts) localizes + flips for RTL.
  useEffect(() => {
    applyAdminLocale(locale);
  }, [locale]);

  return (
    <div className="flex min-h-screen bg-layout-body">
      <Sidebar />

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          sidebarCollapsed ? "lg:ms-[4.25rem]" : "lg:ms-52"
        )}
      >
        <Header />

        <main className="mt-16 flex min-h-0 flex-1 flex-col p-4">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

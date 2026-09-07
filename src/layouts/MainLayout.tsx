import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useLayoutStore } from "@/store";
import { useLocaleStore, applyAdminLocale } from "@/store/locale/localeStore";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

const MainLayout = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useLayoutStore();
  const locale = useLocaleStore((s) => s.locale);

  // Keep <html lang/dir> in sync with the selected admin language so the
  // entire dashboard (and portalled drawers/toasts) localizes + flips for RTL.
  useEffect(() => {
    applyAdminLocale(locale);
  }, [locale]);

  return (
    <SidebarProvider
      open={!sidebarCollapsed}
      onOpenChange={(open) => setSidebarCollapsed(!open)}
      className="h-svh max-h-svh overflow-hidden bg-layout-body"
    >
      <Sidebar />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden bg-layout-body">
        <Header />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-3 sm:p-4">
          <div className="flex h-full min-h-0 min-w-0 max-w-full flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;

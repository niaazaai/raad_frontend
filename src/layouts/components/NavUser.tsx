import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, LogOut, MoreVert, UserCircle } from "iconoir-react";
import { useAuth } from "@/features/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocaleStore } from "@/store/locale/localeStore";
import { isRtlLocale } from "@/data/enums/locale";
import { useUnreadNotificationCount } from "@/modules/Notifications/hooks/useNotifications";
import NotificationDropdown from "@/modules/Notifications/components/NotificationDropdown";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const APP_VERSION = "1.0.0";

const NavUser = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: countData } = useUnreadNotificationCount();
  const [notifOpen, setNotifOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuSide = isMobile ? "bottom" : isRtlLocale(locale) ? "left" : "right";

  const countResponse = countData as { data?: { count?: number } } | undefined;
  const unreadCount = countResponse?.data?.count ?? 0;

  const name = user?.name?.trim() || t("header.user");
  const email = user?.email ?? "";
  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0] ?? name;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;

  const handleLogout = () => {
    // Clear session + navigate immediately; do not block on the API round-trip.
    void logout();
    window.location.assign("/login");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="relative">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              ref={triggerRef}
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              aria-label={t("header.user")}
            >
              <Avatar
                src={user?.avatar}
                firstName={firstName}
                lastName={lastName}
                alt={name}
                size="sm"
                className="rounded-lg"
              />
              <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
              <span className="relative ms-auto group-data-[collapsible=icon]:ms-0">
                <MoreVert className="size-4" />
                {unreadCount > 0 ? (
                  <span
                    className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white"
                    aria-label={`${unreadCount} unread`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={menuSide}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar
                  src={user?.avatar}
                  firstName={firstName}
                  lastName={lastName}
                  alt={name}
                  size="sm"
                  className="rounded-lg"
                />
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => {
                  setNotifOpen(true);
                }}
              >
                <Bell className="size-4" />
                <span className="flex-1">{t("header.notifications")}</span>
                {unreadCount > 0 ? (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-white"
                    )}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  to="/settings"
                  onClick={() => {
                    setOpenMobile(false);
                  }}
                >
                  <UserCircle className="size-4" />
                  {t("header.account")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-70">
                <span className="flex-1">{t("header.version")}</span>
                <span className="text-xs text-muted-foreground">{APP_VERSION}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="danger"
              className="cursor-pointer"
              onSelect={(event) => {
                // Keep the item handler from being cancelled when the menu unmounts.
                event.preventDefault();
                handleLogout();
              }}
            >
              <LogOut className="size-4" />
              {t("header.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationDropdown
          isOpen={notifOpen}
          onClose={() => setNotifOpen(false)}
          anchorRef={triggerRef}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default NavUser;

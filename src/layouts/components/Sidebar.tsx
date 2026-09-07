import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  DashboardDots,
  Settings,
  UserCircle,
  UserCrown,
  Lock,
  OpenBook,
  NavArrowDown,
  ClipboardCheck,
  PeopleTag,
  Activity,
  UserBadgeCheck,
  Learning,
  GraduationCap,
  Presentation,
  Post,
  DollarCircle,
  StatsReport,
  PageFlip,
  CalendarArrowDown,
  Coins,
  PageEdit,
  HandCash,
  List,
} from "iconoir-react";
import { useAuth } from "@/features/auth";
import { useTranslation, type TranslationKey } from "@/i18n/useTranslation";
import { useLocaleStore } from "@/store/locale/localeStore";
import { isRtlLocale } from "@/data/enums/locale";
import {
  buildCourseSidebarRows,
  COURSE_MODULE_ANY_PERMISSIONS,
} from "@/modules/Course/data/courseSidebarNav";
import type { CourseSidebarRow } from "@/modules/Course/data/courseSidebarNav";
import { COURSE_ENTITY_REGISTRY } from "@/modules/Course/data/courseRegistry";
import {
  CourseEntitySidebarIcon,
  CourseOverviewIcon,
} from "@/modules/Course/data/courseEntitySidebarIcons";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  permission?: string;
  anyPermission?: string[];
  /** Spatie role name(s); e.g. activity log visible only with `root`. */
  anyRole?: string[];
  children?: NavItem[];
  skipChildPermissionFilter?: boolean;
  navKey?: string;
}

/**
 * Maps the canonical (English) nav titles — kept stable for group-expand keys —
 * to their translation keys so labels localize without breaking state logic.
 */
const NAV_TITLE_KEYS: Record<string, TranslationKey> = {
  Dashboard: "sidebar.dashboard",
  "User Management": "sidebar.userManagement",
  "Activity log": "sidebar.activityLog",
  Users: "sidebar.users",
  Roles: "sidebar.roles",
  Permissions: "sidebar.permissions",
  Settings: "sidebar.settings",
  Courses: "sidebar.courses",
  Overview: "sidebar.overview",
  Instructors: "sidebar.instructors",
  Students: "sidebar.students",
  Finance: "sidebar.finance",
  "Finance report": "sidebar.financeReport",
  Invoices: "sidebar.invoices",
  "Upcoming dues": "sidebar.upcomingDues",
  Transactions: "sidebar.transactions",
  "Manual invoice": "sidebar.manualInvoice",
  "Manual invoices": "sidebar.manualInvoices",
  "Service income": "sidebar.manualInvoices",
  "Receive payment": "sidebar.receivePayment",
  Classes: "sidebar.classes",
  Attendance: "sidebar.attendance",
  Blogs: "sidebar.blogs",
  "My learning": "sidebar.myLearning",
  "Main categories": "sidebar.mainCategories",
  "Sub categories": "sidebar.subCategories",
  "Student discounts": "sidebar.studentDiscounts",
  "Modules (faasl)": "sidebar.modules",
  Lessons: "sidebar.lessons",
  Assignments: "sidebar.assignments",
  "Downloadable resources": "sidebar.downloadableResources",
  "Quiz files": "sidebar.quizFiles",
  "Subscription plans": "sidebar.subscriptionPlans",
  "Student subscriptions": "sidebar.studentSubscriptions",
};

function linkIsActive(pathname: string, itemPath: string): boolean {
  if (itemPath === "/student") {
    return (
      pathname === "/student" ||
      pathname.startsWith("/student/") ||
      pathname.startsWith("/learn/course")
    );
  }
  if (itemPath === "/course") {
    return pathname === "/course";
  }
  if (itemPath === "/instructors") {
    return pathname === "/instructors";
  }
  if (itemPath === "/classes") {
    return (
      (pathname === "/classes" || pathname.startsWith("/classes/")) &&
      !pathname.includes("/attendance")
    );
  }
  if (itemPath === "/attendance") {
    return pathname === "/attendance" || pathname.includes("/attendance");
  }
  if (itemPath === "/students") {
    return pathname === "/students";
  }
  if (itemPath === "/finance") {
    return pathname === "/finance";
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function courseRowsToNavItems(rows: CourseSidebarRow[]): NavItem[] {
  return rows.map((row, index) => {
    if (row.kind === "overview") {
      return {
        navKey: "course-overview",
        title: "Overview",
        path: "/course",
        icon: <CourseOverviewIcon />,
        anyPermission: COURSE_MODULE_ANY_PERMISSIONS,
      };
    }
    const cfg = COURSE_ENTITY_REGISTRY[row.slug];
    const path = row.slug === "courses" ? "/course/courses" : `/course/${row.slug}`;
    return {
      navKey: `course-entity-${row.slug}-${index}`,
      title: cfg.title,
      path,
      icon: <CourseEntitySidebarIcon slug={row.slug} />,
      permission: cfg.permission,
    };
  });
}

const iconLg = "h-[18px] w-[18px] shrink-0 stroke-[1.5]";
const iconSm = "h-4 w-4 shrink-0 stroke-[1.5]";

const baseNavItems: NavItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <DashboardDots className={iconLg} />,
  },
  {
    title: "User Management",
    icon: <PeopleTag className={iconLg} />,
    children: [
      {
        title: "Activity log",
        path: "/activity-log",
        icon: <Activity className={iconSm} />,
        anyRole: ["root"],
      },
      {
        title: "Users",
        path: "/users",
        icon: <UserCircle className={iconSm} />,
        permission: "users.read",
      },
      {
        title: "Roles",
        path: "/roles",
        icon: <UserCrown className={iconSm} />,
        permission: "roles.read",
      },
      {
        title: "Permissions",
        path: "/permissions",
        icon: <Lock className={iconSm} />,
        permission: "permissions.read",
      },
    ],
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <Settings className={iconLg} />,
  },
];

const Sidebar = () => {
  const { hasPermission, hasAnyPermission, hasAnyRole, user } = useAuth();
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const location = useLocation();
  const { setOpenMobile, state } = useSidebar();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const side = isRtlLocale(locale) ? "right" : "left";

  const displayTitle = (title: string): string =>
    NAV_TITLE_KEYS[title] ? t(NAV_TITLE_KEYS[title]) : title;

  const courseNavChildren = useMemo(
    () => courseRowsToNavItems(buildCourseSidebarRows(hasPermission)),
    [hasPermission]
  );

  const navItems: NavItem[] = useMemo(
    () => [
      baseNavItems[0],
      ...(user?.type === "student"
        ? [
            {
              title: "My learning",
              path: "/student",
              icon: <Learning className={iconLg} />,
            },
          ]
        : []),
      {
        title: "Courses",
        icon: <OpenBook className={iconLg} />,
        anyPermission: COURSE_MODULE_ANY_PERMISSIONS,
        children: courseNavChildren,
        skipChildPermissionFilter: true,
      },
      {
        title: "Classes",
        path: "/classes",
        icon: <Presentation className={iconLg} />,
        permission: COURSE_ENTITY_REGISTRY["lms-classes"].permission,
      },
      {
        title: "Attendance",
        path: "/attendance",
        icon: <ClipboardCheck className={iconLg} />,
        permission: COURSE_ENTITY_REGISTRY["lms-classes"].permission,
      },
      {
        title: "Instructors",
        path: "/instructors",
        icon: <UserBadgeCheck className={iconLg} />,
        permission: COURSE_ENTITY_REGISTRY.instructors.permission,
      },
      {
        title: "Students",
        path: "/students",
        icon: <GraduationCap className={iconLg} />,
        permission: COURSE_ENTITY_REGISTRY["lms-class-students"].permission,
      },
      {
        title: "Finance",
        icon: <DollarCircle className={iconLg} />,
        anyPermission: [
          "finance.read",
          "course.class_students.payment",
          "course.class_students.update",
        ],
        children: [
          {
            title: "Finance report",
            path: "/finance",
            icon: <StatsReport className={iconSm} />,
            permission: "finance.read",
          },
          {
            title: "Invoices",
            path: "/finance/invoices",
            icon: <PageFlip className={iconSm} />,
            permission: "finance.read",
          },
          {
            title: "Upcoming dues",
            path: "/finance/upcoming-dues",
            icon: <CalendarArrowDown className={iconSm} />,
            permission: "finance.read",
          },
          {
            title: "Transactions",
            path: "/finance/transactions",
            icon: <List className={iconSm} />,
            permission: "finance.read",
          },
          {
            title: "Service income",
            path: "/finance/service-income",
            icon: <Coins className={iconSm} />,
            permission: "finance.read",
          },
          {
            title: "Manual invoice",
            path: "/finance/manual-invoice",
            icon: <PageEdit className={iconSm} />,
            anyPermission: [
              "course.class_students.invoice",
              "course.class_students.payment",
              "course.class_students.update",
            ],
          },
          {
            title: "Receive payment",
            path: "/finance/receive-payment",
            icon: <HandCash className={iconSm} />,
            anyPermission: ["course.class_students.payment", "course.class_students.update"],
          },
        ],
      },
      {
        title: "Blogs",
        path: "/blogs",
        icon: <Post className={iconLg} />,
        permission: "blogs.read",
      },
      ...baseNavItems.slice(1),
    ],
    [courseNavChildren, user?.type]
  );

  const isChildActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some((child) => child.path && linkIsActive(location.pathname, child.path));
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
    );
  };

  const filterByPermission = (items: NavItem[]): NavItem[] => {
    return items
      .map((item) => {
        if (item.skipChildPermissionFilter && item.children) {
          if (item.anyPermission?.length && !hasAnyPermission(item.anyPermission)) {
            return null;
          }
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }
          if (item.children.length === 0) {
            return null;
          }
          return item;
        }
        if (item.children) {
          const filteredChildren = filterByPermission(item.children);
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }
        if (item.anyPermission?.length) {
          if (!hasAnyPermission(item.anyPermission)) return null;
        } else if (item.permission && !hasPermission(item.permission)) {
          return null;
        }
        if (item.anyRole?.length && !hasAnyRole(item.anyRole)) {
          return null;
        }
        return item;
      })
      .filter(Boolean) as NavItem[];
  };

  const visibleNavItems = filterByPermission(navItems);

  // Keep groups with an active child expanded when the route changes.
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      for (const item of visibleNavItems) {
        if (item.children && isChildActive(item.children)) {
          next.add(item.title);
        }
      }
      return Array.from(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to path / permission set changes
  }, [location.pathname, visibleNavItems.length]);

  const closeMobile = () => setOpenMobile(false);

  const renderLeaf = (item: NavItem, asSub = false) => {
    const label = displayTitle(item.title);
    const isActive = item.path ? linkIsActive(location.pathname, item.path) : false;

    if (asSub) {
      return (
        <SidebarMenuSubItem key={item.navKey ?? item.path}>
          <SidebarMenuSubButton asChild isActive={isActive} size="sm">
            <NavLink to={item.path!} onClick={closeMobile}>
              {item.icon}
              <span>{label}</span>
            </NavLink>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    }

    return (
      <SidebarMenuItem key={item.navKey ?? item.path}>
        <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
          <NavLink to={item.path!} onClick={closeMobile}>
            {item.icon}
            <span>{label}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderNavItem = (item: NavItem) => {
    if (item.children) {
      const isExpanded = expandedGroups.includes(item.title);
      const hasActiveChild = isChildActive(item.children);
      const label = displayTitle(item.title);

      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            type="button"
            tooltip={label}
            onClick={() => toggleGroup(item.title)}
            className={
              hasActiveChild
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : undefined
            }
          >
            {item.icon}
            <span>{label}</span>
            <NavArrowDown
              className={`ms-auto h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </SidebarMenuButton>
          {isExpanded ? (
            <SidebarMenuSub>{item.children.map((child) => renderLeaf(child, true))}</SidebarMenuSub>
          ) : null}
        </SidebarMenuItem>
      );
    }

    return renderLeaf(item);
  };

  return (
    <SidebarRoot side={side} collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
              tooltip="RAAD LMS"
            >
              <NavLink to="/dashboard" onClick={closeMobile} className="gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
                  <img src="/logo.png" alt="RAAD LMS" className="h-8 w-auto object-contain" />
                </div>
                <div className="grid min-w-0 flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">RAAD LMS</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {state === "collapsed" ? "" : "v1.0.0"}
                  </span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{visibleNavItems.map((item) => renderNavItem(item))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-1 text-[10px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          v1.0.0
        </div>
      </SidebarFooter>
      <SidebarRail />
    </SidebarRoot>
  );
};

export default Sidebar;

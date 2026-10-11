import type { ComponentType, SVGProps } from "react";
import { Tag as Label, ListChecks as ListSelect, ListOrdered as NumberedListLeft, BookOpen as OpenBook, Clapperboard as MediaVideo, ListTodo as TaskList, CircleArrowDown as DownloadCircle, MessageCircleQuestionMark as ChatBubbleQuestion, Timer, CreditCard, ShoppingCart as UserCart, UserCheck as UserBadgeCheck, Presentation, GraduationCap, LayoutGrid as ViewGrid } from "lucide-react";
import type { CourseEntitySlug } from "./courseRegistry";

type Ico = ComponentType<SVGProps<SVGSVGElement>>;

const iconClass = "h-[18px] w-[18px] shrink-0 stroke-2";

const ENTITY_ICON: Record<CourseEntitySlug, Ico> = {
  "main-categories": Label,
  "sub-categories": ListSelect,
  "course-faasls": NumberedListLeft,
  courses: OpenBook,
  lessons: MediaVideo,
  assignments: TaskList,
  "downloadable-resources": DownloadCircle,
  "quiz-files": ChatBubbleQuestion,
  "mock-tests": Timer,
  "subscription-plans": CreditCard,
  "student-subscriptions": UserCart,
  instructors: UserBadgeCheck,
  "lms-classes": Presentation,
  "lms-class-students": GraduationCap,
};

export function CourseOverviewIcon(props: SVGProps<SVGSVGElement>) {
  return <ViewGrid className={iconClass} {...props} />;
}

export function CourseEntitySidebarIcon({
  slug,
  ...rest
}: { slug: CourseEntitySlug } & SVGProps<SVGSVGElement>) {
  const Cmp = ENTITY_ICON[slug];
  return <Cmp className={iconClass} {...rest} />;
}

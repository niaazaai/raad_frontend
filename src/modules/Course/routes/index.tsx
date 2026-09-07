/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { ProtectedRouteType } from "@/types/routes";
import { COURSE_MODULE_ANY_PERMISSIONS } from "../data/courseSidebarNav";

const CourseHub = lazy(() => import("../features/CourseHub/CourseHub"));
const CourseEntityList = lazy(() => import("../features/CourseEntityList/CourseEntityList"));
const ClassStudentsPage = lazy(() => import("../features/ClassStudentsPage/ClassStudentsPage"));
const ClassAttendancePage = lazy(() => import("../features/ClassAttendancePage/ClassAttendancePage"));
const AttendanceHubPage = lazy(() => import("../features/AttendanceHubPage/AttendanceHubPage"));
const CoursesPage = lazy(() => import("../features/CoursesPage/CoursesPage"));

const CourseWizardPage = lazy(() => import("../features/CourseWizardPage/CourseWizardPage"));

export const CourseModuleRoutes: ProtectedRouteType[] = [
  {
    path: "/classes/:classId/students",
    component: <ClassStudentsPage />,
    permission: "course.class_students.read",
  },
  {
    path: "/classes/:classId/attendance",
    component: <ClassAttendancePage />,
    permission: "course.lms_classes.read",
  },
  {
    path: "/attendance",
    component: <AttendanceHubPage />,
    permission: "course.lms_classes.read",
  },
  {
    path: "/classes",
    component: <CourseEntityList forcedSlug="lms-classes" />,
    permission: "course.lms_classes.read",
  },
  {
    path: "/students",
    component: <CourseEntityList forcedSlug="lms-class-students" />,
    permission: "course.class_students.read",
  },
  {
    path: "/instructors",
    component: <CourseEntityList forcedSlug="instructors" />,
    permission: "course.instructors.read",
  },
  {
    path: "/course/courses",
    component: <CoursesPage />,
    permission: "course.courses.read",
  },
  {
    path: "/course/courses/create",
    component: <CourseWizardPage />,
    permission: "course.courses.create",
  },
  {
    path: "/course/courses/:courseId/edit",
    component: <CourseWizardPage />,
    permission: "course.courses.update",
  },
  {
    path: "/course/:slug",
    component: <CourseEntityList />,
  },
  {
    path: "/course",
    component: <CourseHub />,
    anyPermission: COURSE_MODULE_ANY_PERMISSIONS,
  },
];

export default CourseModuleRoutes;

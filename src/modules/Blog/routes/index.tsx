import { lazy } from "react";
import type { ProtectedRouteType } from "@/types/routes";

const BlogList = lazy(() => import("../features/BlogList/BlogList"));

export const BlogRoutes: ProtectedRouteType[] = [
  { path: "/blogs", component: <BlogList />, permission: "blogs.read" },
];

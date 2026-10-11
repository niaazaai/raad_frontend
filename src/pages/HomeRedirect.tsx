import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { getDashboardPath } from "@/data/models/User";

const HomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getDashboardPath(user?.type)} replace />;
};

export default HomeRedirect;

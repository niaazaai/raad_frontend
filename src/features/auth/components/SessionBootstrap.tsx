import { useEffect } from "react";
import { AuthStatus } from "@/data/enums";
import { useAuthStore } from "@/store";

/**
 * Reads the Sanctum session once for every route, including the public site
 * and /login. Protected pages used to be the only place that called /auth/me.
 */
const SessionBootstrap = () => {
  const status = useAuthStore((state) => state.status);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    if (status === AuthStatus.IDLE) {
      void fetchUser();
    }
  }, [status, fetchUser]);

  return null;
};

export default SessionBootstrap;

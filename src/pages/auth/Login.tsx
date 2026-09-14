import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed } from "iconoir-react";
import { Button, Input, Label } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import { LoginSchema, LoginFormData, getDashboardPath } from "@/data/models/User";
import { useAuth } from "@/features/auth";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
import { getSafeRedirectPath } from "@/lib/authRedirect";

const authFormLightScope =
  "[color-scheme:light] text-foreground [--background:#ffffff] [--foreground:#071437] [--muted-foreground:#64748b] [--border:#e5e7eb] [--input:#e5e7eb] [--ring:#0069B4] [--card:#ffffff] [--accent:#f1f5f9] [--accent-foreground:#071437] [--secondary-foreground:#071437]";

/** Subtle radiating lines behind the brand mark (shadcn-style panel). */
const LogoRaysPanel = () => (
  <div className="relative hidden overflow-hidden bg-muted md:block">
    <svg
      className="absolute inset-0 h-full w-full text-foreground/10"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i * 360) / 24;
        return (
          <line
            key={angle}
            x1="200"
            y1="200"
            x2={200 + Math.cos((angle * Math.PI) / 180) * 280}
            y2={200 + Math.sin((angle * Math.PI) / 180) * 280}
            stroke="currentColor"
            strokeWidth="1"
          />
        );
      })}
      <circle cx="200" cy="200" r="72" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="200" cy="200" r="96" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
    </svg>
    {/* Opaque circular backing so PNG transparency does not show the rays through the logo */}
    <div className="absolute inset-0 m-auto h-40 w-40 rounded-full bg-muted p-2">
      <img
        src="/favicon/R.png"
        alt="Raad LMS"
        className="h-full w-full rounded-full bg-muted object-contain opacity-100"
      />
    </div>
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registrationState = location.state as { registered?: boolean; email?: string } | null;
  const registrationNotice =
    registrationState?.registered === true
      ? `Account created${registrationState.email ? ` for ${registrationState.email}` : ""}. You can sign in now.`
      : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = getSafeRedirectPath(searchParams.get("redirect"));
      navigate(redirect ?? getDashboardPath(user.type ?? "student"), { replace: true });
    }
  }, [isAuthenticated, user, navigate, searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      if (result === true) {
        const u = useAuthStore.getState().user;
        const redirect = getSafeRedirectPath(searchParams.get("redirect"));
        navigate(redirect ?? getDashboardPath(u?.type ?? "student"), { replace: true });
      } else {
        const currentError = useAuthStore.getState().error;
        setError("email", { type: "manual", message: currentError || "Invalid email or password" });
      }
    } catch {
      const currentError = useAuthStore.getState().error;
      setError("email", {
        type: "manual",
        message: currentError || "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-svh flex-col items-center justify-center bg-layout-body p-4 md:p-8",
        authFormLightScope
      )}
    >
      <div className="w-full max-w-4xl">
        <Card className="overflow-hidden p-0 shadow-sm">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6 md:p-8">
              <div className="flex flex-col items-center gap-2 text-center">
                <img
                  src="/favicon/R.png"
                  alt="Raad LMS"
                  className="mb-1 h-14 w-14 object-contain md:h-16 md:w-16"
                />
                <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Sign in to your Raad LMS account
                </p>
              </div>

              {registrationNotice ? (
                <p className="rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">
                  {registrationNotice}
                </p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  className={cn("h-11", errors.email ? "border-danger" : "")}
                  {...register("email")}
                />
                {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="ms-auto text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    className={cn("h-11 pe-12", errors.password ? "border-danger" : "")}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeClosed className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-sm text-danger">{errors.password.message}</p>
                ) : null}
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-input accent-primary"
                  {...register("remember")}
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>

              <Button
                type="submit"
                className="h-11 w-full font-semibold"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                Sign in
              </Button>
            </form>

            <LogoRaysPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

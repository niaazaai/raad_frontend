import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed } from "iconoir-react";
import { Button, Input, Label } from "@/components/ui";
import { LoginSchema, LoginFormData, getDashboardPath } from "@/data/models/User";
import { useAuth } from "@/features/auth";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
import { getSafeRedirectPath } from "@/lib/authRedirect";
import LoginWith2FA from "./LoginWith2FA";

const authFormLightScope =
  "[color-scheme:light] text-foreground [--background:#ffffff] [--foreground:#071437] [--muted-foreground:#64748b] [--border:#e5e7eb] [--input:#e5e7eb] [--ring:#0069B4] [--card:#ffffff] [--accent:#f1f5f9] [--accent-foreground:#071437] [--secondary-foreground:#071437]";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, pending2FA } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      if (result === true) {
        const u = useAuthStore.getState().user;
        const redirect = getSafeRedirectPath(searchParams.get("redirect"));
        navigate(redirect ?? getDashboardPath(u?.type ?? "student"), { replace: true });
      } else if (result !== "requires_2fa") {
        const currentError = useAuthStore.getState().error;
        setError("email", { type: "manual", message: currentError || "Invalid email or password" });
      }
    } catch {
      const currentError = useAuthStore.getState().error;
      setError("email", { type: "manual", message: currentError || "An error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pending2FA) {
    return (
      <div className="min-h-screen bg-layout-body flex flex-col">
        <header className="border-b border-border bg-card/60 backdrop-blur">
          <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
            <Link to="/" className="text-base font-semibold text-foreground hover:text-primary transition-colors">
              Raad LMS
            </Link>
          </nav>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8">
          <section className={cn("w-full rounded-xl border border-border bg-card p-6 shadow-sm md:p-7", authFormLightScope)}>
            <LoginWith2FA />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-layout-body">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:px-6">
        <div className={cn("w-full rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7", authFormLightScope)}>
          <div className="mb-5 flex justify-center">
            <img src="/logo.png" alt="Raad LMS" className="h-12 w-auto object-contain md:h-14" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
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
              <Label htmlFor="password">Password</Label>
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
              {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border border-input accent-primary" {...register("remember")} />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-active">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="h-11 w-full font-semibold" disabled={isSubmitting} loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium text-primary hover:text-primary-active">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

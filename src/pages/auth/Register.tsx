import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed } from "iconoir-react";
import { Button, Input, Label } from "@/components/ui";
import { RegisterSchema, type RegisterFormData } from "@/data/models/User";
import { callApi, fetchCsrfCookie } from "@/services";
import { API_ENDPOINTS } from "@/data/constants/endpoints";
import { RequestMethod } from "@/data/constants/methods";
import { cn } from "@/lib/utils";

const authFormLightScope =
  "[color-scheme:light] text-foreground [--background:#ffffff] [--foreground:#071437] [--muted-foreground:#64748b] [--border:#e5e7eb] [--input:#e5e7eb] [--ring:#0069B4] [--card:#ffffff] [--accent:#f1f5f9] [--accent-foreground:#071437] [--secondary-foreground:#071437]";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", password_confirmation: "" },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await fetchCsrfCookie();
      const response = await callApi({
        url: API_ENDPOINTS.AUTH.REGISTER,
        method: RequestMethod.POST,
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          password_confirmation: data.password_confirmation,
        },
      });

      const body = response.data as { message?: string; email?: string };
      if (response.ok) {
        navigate("/verify-email", { replace: true, state: { email: body?.email ?? data.email } });
      } else {
        setSubmitError((body?.message as string) || "Registration failed. Please try again.");
      }
    } catch {
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-layout-body">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:px-6">
        <div className={cn("w-full rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7", authFormLightScope)}>
          <div className="mb-5 flex justify-center">
            <img src="/logo.png" alt="Raad LMS" className="h-12 w-auto object-contain md:h-14" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {submitError ? (
              <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{submitError}</p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" type="text" autoComplete="name" placeholder="John Doe" className="h-11" {...register("name")} />
              {errors.name ? <p className="text-sm text-danger">{errors.name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" className="h-11" {...register("email")} />
              {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="h-11 pe-12"
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

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm password</Label>
              <Input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                className="h-11"
                {...register("password_confirmation")}
              />
              {errors.password_confirmation ? (
                <p className="text-sm text-danger">{errors.password_confirmation.message}</p>
              ) : null}
            </div>

            <Button type="submit" className="h-11 w-full font-semibold" disabled={isSubmitting} loading={isSubmitting}>
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:text-primary-active">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;

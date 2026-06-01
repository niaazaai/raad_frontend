import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDisk, Eye, EyeClosed } from "iconoir-react";
import { Spinner } from "@/components/ui/spinner";
import { useUser, useCreateUser, useUpdateUser } from "../../hooks";
import { z } from "zod";
import type { UserManagement } from "../../data/models";
import { Button, ImageDropzone } from "@/components/ui";
import {
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const CreateUserFormSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    type: z.enum(["admin", "student", "instructor"]).default("student"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

const UpdateUserFormSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    type: z.enum(["admin", "student", "instructor"]).optional(),
    password: z.union([
      z.literal(""),
      z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol"),
    ]).optional(),
    password_confirmation: z.string().optional().or(z.literal("")),
  })
  .refine((data) => !data.password || data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type CreateUserFormData = z.infer<typeof CreateUserFormSchema>;
type UpdateUserFormData = z.infer<typeof UpdateUserFormSchema>;

interface UserFormDrawerProps {
  user: UserManagement | null;
  onSuccess: () => void;
}

export const UserFormDrawer = ({ user, onSuccess }: UserFormDrawerProps) => {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const { data: existingData, isLoading: isLoadingUser } = useUser(user?.id ?? 0);
  const existingUser = existingData?.data;

  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser(user?.id ?? 0);
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEdit ? UpdateUserFormSchema : CreateUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      type: "student",
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    if (existingUser && isEdit) {
      reset({
        name: existingUser.name,
        email: existingUser.email,
        type: existingUser.type ?? "student",
        password: "",
        password_confirmation: "",
      });
      setAvatarFile(null);
    } else if (!user) {
      reset({
        name: "",
        email: "",
        type: "student",
        password: "",
        password_confirmation: "",
      });
      setAvatarFile(null);
    }
  }, [existingUser, user, isEdit, reset]);

  const onSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      type: (data as { type?: string }).type,
      status: user?.status || "active",
    };
    if (!isEdit || data.password) {
      payload.password = data.password;
      payload.password_confirmation = data.password_confirmation;
    }
    if (avatarFile) {
      payload.avatar = avatarFile;
    }

    if (isEdit && user) {
      updateUser(payload, { onSuccess });
    } else {
      createUser(payload, { onSuccess });
    }
  };

  const avatarPreviewUrl =
    isEdit && existingUser?.avatar ? existingUser.avatar : null;

  if (isEdit && isLoadingUser && !existingUser) {
    return (
      <>
        <DrawerHeader>
          <DrawerTitle>Edit User</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        </DrawerBody>
      </>
    );
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{isEdit ? "Edit User" : "Create User"}</DrawerTitle>
        <DrawerDescription>
          {isEdit
            ? "Update user information"
            : "Add a new user to the system. Assign roles separately via the Role action."}
        </DrawerDescription>
      </DrawerHeader>

      <form id="user-form" onSubmit={handleSubmit(onSubmit)}>
        <DrawerBody className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <ImageDropzone
              accept="image/jpeg,image/png,image/webp,image/jpg"
              label="Profile picture"
              hint="Drag and drop or click to upload (JPG, PNG, max 2MB)"
              value={avatarFile}
              onSelect={setAvatarFile}
              previewMode="square"
              initialPreviewUrl={avatarFile ? null : avatarPreviewUrl}
            />
          </div>

          <div className="space-y-4 rounded-xl border border-border p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                {...register("name")}
                className={cn(
                  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/50",
                  errors.name ? "border-danger" : "border-input"
                )}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-danger">
                  {(errors as Record<string, { message?: string }>).name?.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Email <span className="text-danger">*</span>
              </label>
              <input
                {...register("email")}
                type="email"
                className={cn(
                  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/50",
                  errors.email ? "border-danger" : "border-input"
                )}
                placeholder="user@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger">
                  {(errors as Record<string, { message?: string }>).email?.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">User type</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value ?? "student"}
                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/50"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Password {isEdit && "(leave blank to keep current)"}
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className={cn(
                    "w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/50",
                    errors.password ? "border-danger" : "border-input"
                  )}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger">
                  {(errors as Record<string, { message?: string }>).password?.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <input
                {...register("password_confirmation")}
                type={showPassword ? "text" : "password"}
                className={cn(
                  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/50",
                  errors.password_confirmation ? "border-danger" : "border-input"
                )}
                placeholder="Confirm password"
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-xs text-danger">
                  {(errors as Record<string, { message?: string }>).password_confirmation?.message}
                </p>
              )}
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button type="submit" form="user-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="h-4 w-4" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <FloppyDisk className="h-4 w-4" />
                {isEdit ? "Update User" : "Create User"}
              </>
            )}
          </Button>
        </DrawerFooter>
      </form>
    </>
  );
};

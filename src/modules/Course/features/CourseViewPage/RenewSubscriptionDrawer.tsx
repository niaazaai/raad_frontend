import { useMemo, useState } from "react";
import { CircleCheck, Clock, Phone } from "lucide-react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  ImageDropzone,
} from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { CONTACT_INFO } from "@/components/website/websiteData";
import { useAuth } from "@/features/auth";
import { RequestMethod } from "@/data/constants/methods";
import { useMutationApi } from "@/hooks";
import {
  getPublicCourseDetailFromResponse,
  PUBLIC_COURSES_QUERY_KEY,
  usePublicCourseDetail,
  type PublicSubscriptionPlan,
} from "@/hooks/usePublicCourses";
import { getMyEnrollmentsFromResponse, useMyEnrollments } from "@/hooks/useStudentLearning";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatMoney(amount: string | number | null | undefined): string {
  if (amount == null || String(amount).trim() === "") return "—";
  const n = Number.parseFloat(String(amount));
  if (Number.isNaN(n)) return `${amount} AFN`;
  const whole = Math.abs(n - Math.round(n)) < 0.001;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: whole ? 0 : 2,
    minimumFractionDigits: whole ? 0 : 2,
  }).format(n);
  return `${formatted} AFN`;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function daysUntil(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

function RenewSubscriptionDrawer({
  courseId,
  courseTitle,
  open,
  onClose,
}: {
  courseId: number | null;
  courseTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const detailQuery = usePublicCourseDetail(courseId, { enabled: open && courseId != null });
  const enrollmentsQuery = useMyEnrollments({
    course_id: courseId,
    per_page: 48,
    enabled: open && courseId != null,
  });

  const plans: PublicSubscriptionPlan[] = useMemo(() => {
    const detail = getPublicCourseDetailFromResponse(detailQuery.data);
    return detail?.subscription_plans ?? [];
  }, [detailQuery.data]);

  const blockedPlanIds = useMemo(() => {
    const blocked = new Set<number>();
    for (const row of getMyEnrollmentsFromResponse(enrollmentsQuery.data)) {
      if (row.subscription_status === "pending" || row.subscription_status === "inactive") {
        blocked.add(row.plan_id);
        continue;
      }
      if (row.subscription_status === "active") {
        const diff = daysUntil(row.subscription_end_date);
        if (diff == null || diff > 0) blocked.add(row.plan_id);
      }
    }
    return blocked;
  }, [enrollmentsQuery.data]);

  const createSubscription = useMutationApi({
    url: "/student-subscriptions",
    method: RequestMethod.POST,
    hasFiles: true,
    invalidateKeys: [["me", "enrollments"], [...PUBLIC_COURSES_QUERY_KEY]],
  });

  const close = () => {
    setSelectedPlanId(null);
    setVoucherFile(null);
    setShowSuccess(false);
    onClose();
  };

  return (
    <Drawer open={open} swipeDirection="down" showSwipeHandle onClose={close}>
      <DrawerOverlay />
      <DrawerContent className="mx-auto w-full max-w-5xl">
        <DrawerHeader>
          <DrawerTitle>Renew subscription</DrawerTitle>
          <DrawerDescription>
            {courseTitle ? `${courseTitle}. ` : ""}
            Select a plan and upload your payment voucher. You are already signed in.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Phone className="h-4 w-4 text-warning" /> Payment instructions
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              Pay the selected plan amount to:
              <span className="mt-2 block rounded-md bg-card px-3 py-2 font-mono text-xs">
                Raad Institute • A/C: 1234567890 • IBAN: AE12 3456 7890 1234 5678
              </span>
              <span className="mt-2 block text-muted-foreground">
                Upload the bank voucher below. Your subscription will be reviewed and activated within 24–48 hours.
                Support: {CONTACT_INFO.phone}
              </span>
            </p>
          </div>

          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-6 rounded-full bg-emerald-100 p-5 dark:bg-emerald-900/50">
                <CircleCheck className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Voucher received</h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                We will review your payment and activate the course shortly.
              </p>
              <Button type="button" onClick={close}>
                Back to my learning
              </Button>
            </div>
          ) : detailQuery.isLoading ? (
            <div className="flex min-h-[160px] items-center justify-center">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No subscription plans are available for this course yet.
            </p>
          ) : (
            <>
              <div>
                <p className="mb-4 text-sm font-medium text-foreground">Select a plan</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {plans.map((plan) => {
                    const blocked = blockedPlanIds.has(plan.id);
                    const selected = selectedPlanId === plan.id;
                    const description = plan.plan_description ? stripHtml(plan.plan_description) : "";
                    return (
                      <div
                        key={plan.id}
                        role="button"
                        tabIndex={blocked ? -1 : 0}
                        onClick={() => {
                          if (blocked) return;
                          setSelectedPlanId(selected ? null : plan.id);
                        }}
                        onKeyDown={(event) => {
                          if (blocked) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedPlanId(selected ? null : plan.id);
                          }
                        }}
                        className={cn(
                          "flex h-full flex-col rounded-2xl border bg-card p-5 text-start transition-colors",
                          blocked
                            ? "cursor-not-allowed border-border bg-muted/40 opacity-70"
                            : "cursor-pointer hover:border-primary/50",
                          !blocked && selected && "border-primary ring-2 ring-primary/25",
                        )}
                      >
                        <p className="text-base font-semibold text-foreground">{plan.plan_name}</p>
                        <p dir="ltr" className="mt-3 text-2xl font-bold tabular-nums text-foreground">
                          {formatMoney(plan.price)}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {plan.duration_in_days} days
                        </p>
                        {description ? (
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
                        ) : null}
                        <div className="mt-4">
                          {blocked ? (
                            <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                              Already pending or active
                            </span>
                          ) : selected ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                              <CircleCheck className="h-3.5 w-3.5" /> Selected
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-primary">Select plan</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ImageDropzone
                accept="image/*,application/pdf"
                label="Upload bank voucher (image or PDF)"
                hint="JPG, PNG, or PDF · max 10 MB · proof of payment"
                value={voucherFile}
                onSelect={setVoucherFile}
                previewMode="wide"
                mediaPreview="file"
              />

              <Button
                type="button"
                className="w-full"
                disabled={createSubscription.isPending || selectedPlanId == null || voucherFile == null}
                onClick={async () => {
                  if (selectedPlanId == null || voucherFile == null || courseId == null || user?.id == null) {
                    toast.error("Select a plan and upload your voucher.");
                    return;
                  }
                  if (blockedPlanIds.has(selectedPlanId)) {
                    toast.error("You already have a pending or active subscription for this plan.");
                    return;
                  }
                  try {
                    await createSubscription.mutateAsync({
                      plan_id: String(selectedPlanId),
                      course_id: String(courseId),
                      user_id: String(user.id),
                      voucher_file: voucherFile,
                    });
                    setShowSuccess(true);
                  } catch {
                    // callApi surfaces the error
                  }
                }}
              >
                {createSubscription.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Submit voucher for review
              </Button>
            </>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export default RenewSubscriptionDrawer;

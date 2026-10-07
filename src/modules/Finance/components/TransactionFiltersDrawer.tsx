import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowDownToLine,
  Building2,
  CircleSlash,
  Clock,
  Coins,
  FileX2,
  GraduationCap,
  Landmark,
  Layers,
  ListFilter,
  Undo2,
  Users,
} from "lucide-react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
} from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import type { FinancialTransactionFilter, TransactionPayer } from "../data/models/FinanceReport";
import FinancePeriodFilter from "./FinancePeriodFilter";
import {
  countActiveTransactionFilters,
  defaultTransactionFilters,
  type TransactionFilterState,
} from "./financeFormat";

type OptionIcon = ComponentType<{ className?: string }>;

const TYPE_ICONS: Record<FinancialTransactionFilter | "", OptionIcon> = {
  "": Layers,
  payment: ArrowDownToLine,
  refund: Undo2,
  recovery: Coins,
  write_off: FileX2,
  irrecoverable: FileX2,
  mof: Landmark,
  other: Users,
  cancellation: CircleSlash,
  pending: Clock,
};

const PAYER_ICONS: Record<TransactionPayer | "", OptionIcon> = {
  "": Users,
  student: GraduationCap,
  mof: Landmark,
  other_party: Building2,
};

interface OptionGridProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  icons: Record<string, OptionIcon>;
  onSelect: (next: T) => void;
  columns?: string;
}

const OptionGrid = <T extends string>({
  options,
  value,
  icons,
  onSelect,
  columns = "grid-cols-2 sm:grid-cols-3",
}: OptionGridProps<T>) => (
  <div className={cn("grid gap-2", columns)}>
    {options.map((option) => {
      const Icon = icons[option.value];
      const active = value === option.value;
      return (
        <Button
          key={option.value || "all"}
          type="button"
          aria-pressed={active}
          variant={active ? "default" : "outline"}
          className={cn("justify-start", !active && "text-muted-foreground hover:text-foreground")}
          onClick={() => onSelect(option.value)}
        >
          <Icon className="h-4 w-4" />
          <span className="truncate">{option.label}</span>
        </Button>
      );
    })}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
    {children}
  </section>
);

interface TransactionFiltersDrawerProps {
  value: TransactionFilterState;
  onApply: (next: TransactionFilterState) => void;
  typeOptions: { value: FinancialTransactionFilter | ""; label: string }[];
  payerOptions: { value: TransactionPayer | ""; label: string }[];
}

/**
 * Bottom sheet holding every transaction filter. Choices are staged locally and only
 * committed on Apply, so the table refetches once instead of on each click.
 */
const TransactionFiltersDrawer = ({
  value,
  onApply,
  typeOptions,
  payerOptions,
}: TransactionFiltersDrawerProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TransactionFilterState>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const activeCount = countActiveTransactionFilters(value);

  const apply = (next: TransactionFilterState) => {
    onApply(next);
    setOpen(false);
  };

  return (
    <Drawer
      open={open}
      swipeDirection="down"
      showSwipeHandle
      onOpenChange={(nextOpen) => setOpen(nextOpen)}
    >
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <ListFilter className="h-4 w-4" />
        {t("fin.filters.trigger")}
        {activeCount > 0 ? (
          <span className="ms-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white tabular-nums">
            {activeCount}
          </span>
        ) : null}
      </Button>

      <DrawerOverlay />
      <DrawerContent className="mx-auto max-w-4xl">
        <DrawerHeader>
          <DrawerTitle>{t("fin.filters.title")}</DrawerTitle>
          <DrawerDescription>{t("fin.filters.subtitle")}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <Section title={t("fin.period.label")}>
            <FinancePeriodFilter
              idPrefix="tx-period"
              value={draft.period}
              onChange={(period) => setDraft((prev) => ({ ...prev, period }))}
            />
          </Section>

          <Section title={t("fin.filters.type")}>
            <OptionGrid
              options={typeOptions}
              value={draft.filter}
              icons={TYPE_ICONS}
              onSelect={(filter) => setDraft((prev) => ({ ...prev, filter }))}
            />
          </Section>

          <Section title={t("fin.filters.payer")}>
            <OptionGrid
              options={payerOptions}
              value={draft.payer}
              icons={PAYER_ICONS}
              columns="grid-cols-2 sm:grid-cols-4"
              onSelect={(payer) => setDraft((prev) => ({ ...prev, payer }))}
            />
          </Section>
        </DrawerBody>
        <DrawerFooter className="justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDraft(defaultTransactionFilters())}
          >
            {t("fin.filters.reset")}
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("fin.filters.close")}
            </Button>
            <Button type="button" onClick={() => apply(draft)}>
              {t("fin.filters.apply")}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TransactionFiltersDrawer;

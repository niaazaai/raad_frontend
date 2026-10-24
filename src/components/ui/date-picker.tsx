"use client";

import * as React from "react";
import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CalendarSearch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { isRtlLocale } from "@/data/enums/locale";
import {
  formatIsoDateLabel,
  formatIsoMonthLabel,
  localIsoDate,
  localIsoMonth,
  parseIsoDate,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/store/locale/localeStore";

type TriggerSize = "sm" | "default";

interface BasePickerProps {
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: TriggerSize;
  align?: "start" | "center" | "end";
}

function useCalendarDir(): "ltr" | "rtl" {
  const locale = useLocaleStore((s) => s.locale);
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

function useWideCalendar(): boolean {
  const [wide, setWide] = React.useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(min-width: 768px)").matches
  );

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return wide;
}

/**
 * Finance dates are Gregorian, but `fa` defaults to the Persian calendar in `Intl`.
 * Pinning `ca-gregory` keeps month names localised without switching calendar systems.
 */
function useIntlLocale(): string {
  const locale = useLocaleStore((s) => s.locale);
  return `${locale}-u-ca-gregory`;
}

const PickerTrigger = ({
  label,
  empty,
  icon,
  size = "default",
  className,
  disabled,
  id,
}: {
  label: string;
  empty: boolean;
  icon: React.ReactNode;
  size?: TriggerSize;
  className?: string;
  disabled?: boolean;
  id?: string;
}) => (
  <PopoverTrigger
    render={
      <Button
        id={id}
        type="button"
        variant="outline"
        size={size}
        disabled={disabled}
        data-empty={empty}
        className={cn(
          "justify-start font-normal tabular-nums data-[empty=true]:text-muted-foreground",
          className
        )}
      />
    }
  >
    {icon}
    {label}
  </PopoverTrigger>
);

/* ------------------------------------------------------------------ single day */

interface DatePickerProps extends BasePickerProps {
  /** `YYYY-MM-DD` */
  value?: string;
  onChange: (value: string) => void;
}

const DatePicker = ({
  value,
  onChange,
  placeholder = "Pick a date",
  align = "start",
  size,
  className,
  disabled,
  id,
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const dir = useCalendarDir();
  const intlLocale = useIntlLocale();
  const selected = parseIsoDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PickerTrigger
        id={id}
        empty={!selected}
        size={size}
        disabled={disabled}
        className={className}
        icon={<CalendarDays />}
        label={selected ? formatIsoDateLabel(value, intlLocale) : placeholder}
      />
      <PopoverContent align={align} className="p-0">
        <Calendar
          mode="single"
          dir={dir}
          autoFocus
          captionLayout="dropdown"
          startMonth={new Date(2000, 0)}
          endMonth={new Date(new Date().getFullYear() + 5, 11)}
          defaultMonth={selected}
          selected={selected}
          onSelect={(next) => {
            if (!next) return;
            onChange(localIsoDate(next));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

/* ------------------------------------------------------------------ month */

const MONTH_COUNT = 12;

interface MonthPickerProps extends BasePickerProps {
  /** `YYYY-MM` */
  value?: string;
  onChange: (value: string) => void;
}

const MonthPicker = ({
  value,
  onChange,
  placeholder = "Pick a month",
  align = "start",
  size,
  className,
  disabled,
  id,
}: MonthPickerProps) => {
  const [open, setOpen] = React.useState(false);
  const intlLocale = useIntlLocale();
  const selectedMonth = value && /^\d{4}-\d{2}$/.test(value) ? value : undefined;
  const [cursorYear, setCursorYear] = React.useState(() =>
    Number((selectedMonth ?? localIsoMonth()).slice(0, 4))
  );

  React.useEffect(() => {
    if (open && selectedMonth) setCursorYear(Number(selectedMonth.slice(0, 4)));
  }, [open, selectedMonth]);

  const monthNames = React.useMemo(
    () =>
      Array.from({ length: MONTH_COUNT }, (_, i) =>
        new Date(2000, i, 1).toLocaleDateString(intlLocale, { month: "short" })
      ),
    [intlLocale]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PickerTrigger
        id={id}
        empty={!selectedMonth}
        size={size}
        disabled={disabled}
        className={className}
        icon={<CalendarRange />}
        label={selectedMonth ? formatIsoMonthLabel(`${selectedMonth}-01`, intlLocale) : placeholder}
      />
      <PopoverContent align={align} className="w-64 p-3">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Previous year"
            onClick={() => setCursorYear((y) => y - 1)}
          >
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <span className="text-sm font-medium tabular-nums">{cursorYear}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Next year"
            onClick={() => setCursorYear((y) => y + 1)}
          >
            <ChevronRight className="rtl:rotate-180" />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {monthNames.map((name, index) => {
            const iso = `${cursorYear}-${String(index + 1).padStart(2, "0")}`;
            const active = iso === selectedMonth;
            return (
              <Button
                key={iso}
                type="button"
                size="sm"
                variant={active ? "default" : "ghost"}
                onClick={() => {
                  onChange(iso);
                  setOpen(false);
                }}
              >
                {name}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ------------------------------------------------------------------ year */

const YEAR_PAGE_SIZE = 12;

interface YearPickerProps extends BasePickerProps {
  /** `YYYY` */
  value?: string;
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
}

const YearPicker = ({
  value,
  onChange,
  placeholder = "Pick a year",
  align = "start",
  size,
  className,
  disabled,
  id,
  minYear = 2000,
  maxYear = new Date().getFullYear() + 5,
}: YearPickerProps) => {
  const [open, setOpen] = React.useState(false);
  const selectedYear = value && /^\d{4}$/.test(value) ? Number(value) : undefined;
  const anchor = selectedYear ?? new Date().getFullYear();
  const [pageStart, setPageStart] = React.useState(
    () => anchor - Math.floor(YEAR_PAGE_SIZE / 2) + 1
  );

  React.useEffect(() => {
    if (open) setPageStart(anchor - Math.floor(YEAR_PAGE_SIZE / 2) + 1);
  }, [open, anchor]);

  const years = Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => pageStart + i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PickerTrigger
        id={id}
        empty={!selectedYear}
        size={size}
        disabled={disabled}
        className={className}
        icon={<CalendarClock />}
        label={selectedYear ? String(selectedYear) : placeholder}
      />
      <PopoverContent align={align} className="w-64 p-3">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Previous years"
            disabled={pageStart <= minYear}
            onClick={() => setPageStart((y) => y - YEAR_PAGE_SIZE)}
          >
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <span className="text-sm font-medium tabular-nums">
            {years[0]} – {years[years.length - 1]}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Next years"
            disabled={pageStart + YEAR_PAGE_SIZE > maxYear}
            onClick={() => setPageStart((y) => y + YEAR_PAGE_SIZE)}
          >
            <ChevronRight className="rtl:rotate-180" />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {years.map((year) => (
            <Button
              key={year}
              type="button"
              size="sm"
              variant={year === selectedYear ? "default" : "ghost"}
              disabled={year < minYear || year > maxYear}
              className="tabular-nums"
              onClick={() => {
                onChange(String(year));
                setOpen(false);
              }}
            >
              {year}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ------------------------------------------------------------------ range */

export interface IsoDateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps extends BasePickerProps {
  value: IsoDateRange;
  onChange: (value: IsoDateRange) => void;
  /** Separator between the two dates in the trigger label. Directionless so RTL reads correctly. */
  separator?: string;
}

const DateRangePicker = ({
  value,
  onChange,
  placeholder = "Pick a date range",
  separator = "–",
  align = "start",
  size,
  className,
  disabled,
  id,
}: DateRangePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const dir = useCalendarDir();
  const wide = useWideCalendar();
  const intlLocale = useIntlLocale();
  const from = parseIsoDate(value.from);
  const to = parseIsoDate(value.to);

  const label = from
    ? `${formatIsoDateLabel(value.from, intlLocale)} ${separator} ${
        to ? formatIsoDateLabel(value.to, intlLocale) : "…"
      }`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PickerTrigger
        id={id}
        empty={!from}
        size={size}
        disabled={disabled}
        className={className}
        icon={<CalendarSearch />}
        label={label}
      />
      <PopoverContent align={align} className="p-0">
        <Calendar
          mode="range"
          dir={dir}
          autoFocus
          numberOfMonths={wide ? 2 : 1}
          defaultMonth={from}
          selected={from ? { from, to } : undefined}
          onSelect={(range) => {
            if (!range?.from) return;
            const nextFrom = localIsoDate(range.from);
            const nextTo = range.to ? localIsoDate(range.to) : nextFrom;
            onChange({ from: nextFrom, to: nextTo });
            if (range.to) setOpen(false);
          }}
          className="md:[--cell-size:--spacing(9)]"
        />
      </PopoverContent>
    </Popover>
  );
};

export { DatePicker, MonthPicker, YearPicker, DateRangePicker };

import { cn } from "@/lib/utils";

interface ExcelSheetIconProps {
  className?: string;
}

/** Excel-style spreadsheet glyph for export actions. */
const ExcelSheetIcon = ({ className }: ExcelSheetIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="3.5" fill="#185C37" />
      <rect x="3.15" y="3.15" width="17.7" height="17.7" rx="2.6" fill="#217346" />
      <path
        fill="#fff"
        d="M7.05 6.2h3.55L12.1 9.4l1.55-3.2h3.3l-3.15 5.55 3.4 5.85h-3.55L12.1 14.4l-1.6 3.2H7.2l3.35-5.85L7.05 6.2Z"
      />
    </svg>
  );
};

export default ExcelSheetIcon;

export type FinanceModule = "class" | "course";
export type FinancePeriod = "daily" | "monthly" | "yearly" | "range" | "all";

export interface FinanceSummary {
  class_income: number;
  course_income: number;
  total_income: number;
  fees_amount: number;
  gross_amount?: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  refund_amount: number;
  mof_receivable: number;
  other_receivable: number;
  irrecoverable_debt: number;
  net_receivable: number;
  service_income?: number;
  service_cost?: number;
  // Cohort (fee date in period)
  cancelled_amount?: number;
  student_receivable?: number;
  credit_amount?: number;
  enrollment_count?: number;
  free_count?: number;
  // Cash (transaction date in period)
  cash_collected?: number;
  cash_refunded?: number;
  cash_recovered?: number;
  cash_net?: number;
  written_off_in_period?: number;
}

/** Report rows: enrollments with money movement in the period, or enrollments whose fee falls in it. */
export type FinanceReportScope = "activity" | "cohort";

export type FinanceBreakdownMetric =
  | "gross"
  | "discount"
  | "net"
  | "paid"
  | "refund"
  | "cancelled"
  | "irrecoverable"
  | "receivable"
  | "student_receivable"
  | "mof"
  | "other"
  | "credit"
  | "collected"
  | "refunded"
  | "recovered"
  | "written_off"
  | "service_income"
  | "service_cost";

export interface FinanceBreakdownEnrollmentRow {
  id: number;
  class_id?: number | null;
  student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  father_name?: string | null;
  phone_number?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  fee_date?: string | null;
  last_payment_date?: string | null;
  payment_status?: string | null;
  payment_status_label?: string | null;
  other_party_name?: string | null;
  amount: number;
  gross_amount?: number;
  discount_amount?: number;
  net_amount?: number;
  paid_amount?: number;
  refund_amount?: number;
  irrecoverable_debt?: number;
  net_receivable?: number;
  currency?: string | null;
}

export interface FinanceBreakdownMeta {
  metric: FinanceBreakdownMetric;
  kind: "enrollments" | "transactions";
  total: number;
}

export interface ClassStudentMoveRow {
  id: number;
  student_id: number;
  from_class_student_id: number;
  to_class_student_id: number;
  from_class_id: number;
  from_class_name?: string | null;
  from_class_code?: string | null;
  to_class_id: number;
  to_class_name?: string | null;
  to_class_code?: string | null;
  old_class_fee: number;
  new_class_fee: number;
  move_date?: string | null;
  reason?: string | null;
  moved_transaction_count: number;
  moved_invoice_count: number;
  created_by_name?: string | null;
  created_at?: string | null;
}

export interface FinancePeriodMeta {
  type: FinancePeriod;
  from: string;
  to: string;
}

export interface FinanceClassRow {
  id: number;
  class_id?: number | null;
  student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  father_name?: string | null;
  phone_number?: string | null;
  national_id?: string | null;
  email?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  invoice_number?: string | null;
  schedule_days?: string | null;
  schedule_days_label?: string | null;
  timing?: string | null;
  fees_amount?: number | string | null;
  discount_percent?: number | string | null;
  discount_amount?: number | string | null;
  net_amount?: number | string | null;
  paid_amount?: number | string | null;
  refund_amount?: number | string | null;
  mof_receivable_amount?: number | string | null;
  other_receivable_amount?: number | string | null;
  other_party_name?: string | null;
  irrecoverable_debt?: number | string | null;
  net_receivable?: number | string | null;
  payment_date?: string | null;
  teacher_name?: string | null;
  payment_status?: string | null;
  payment_status_label?: string | null;
  class_status?: string | null;
  class_status_label?: string | null;
  starting_date?: string | null;
  ending_date?: string | null;
  enrollment_date?: string | null;
  fee_date?: string | null;
  paid_in_period?: number | null;
  cancelled_amount?: number | string | null;
  student_receivable_amount?: number | string | null;
  credit_amount?: number | string | null;
  moved_to_class_student_id?: number | null;
  moved_from_class_student_id?: number | null;
  next_installment_date?: string | null;
  remarks?: string | null;
  currency?: string | null;
}

export interface FinanceCourseRow {
  id: number;
  student_name?: string | null;
  student_email?: string | null;
  course_title?: string | null;
  instructor_name?: string | null;
  plan_name?: string | null;
  plan_duration_days?: number | string | null;
  amount?: number | string | null;
  payment_status?: string | null;
  payment_status_label?: string | null;
  purchase_date?: string | null;
  subscription_public_id?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  subscription_status?: string | null;
  subscription_status_label?: string | null;
}

export interface FinanceTransactionInvoice {
  id: number;
  invoice_number: string;
  amount?: number | string | null;
  currency?: string | null;
  issued_at?: string | null;
  pdf_url?: string | null;
}

export interface FinanceTransaction {
  id: number;
  class_student_id?: number | null;
  type?: string | null;
  type_label?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  exchange_rate?: number | string | null;
  transaction_date?: string | null;
  next_installment_date?: string | null;
  invoice_id?: number | null;
  invoice?: FinanceTransactionInvoice | null;
  service_name?: string | null;
  service_cost?: number | string | null;
  internal_notes?: string | null;
  transaction_type?: string | null;
  transaction_type_label?: string | null;
  payer?: string | null;
  payer_label?: string | null;
  related_transaction_id?: number | null;
  is_recovery?: boolean;
  notes?: string | null;
  created_at?: string | null;
}

export interface FinanceReportParams {
  module: FinanceModule;
  period: FinancePeriod;
  date?: string;
  month?: string;
  year?: number;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: string;
  include_pending?: boolean | 0 | 1;
  scope?: FinanceReportScope;
  payment_status?: string;
}

export interface FinanceInvoiceRow {
  id: number;
  invoice_number: string;
  amount?: number | string | null;
  currency?: string | null;
  exchange_rate?: number | string | null;
  issued_at?: string | null;
  transaction_date?: string | null;
  payer?: string | null;
  pdf_url?: string | null;
  class_student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  father_name?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  service_name?: string | null;
  service_cost?: number | string | null;
  internal_notes?: string | null;
  customer_name?: string | null;
  transaction?: FinanceTransaction | null;
}

export interface ManualInvoiceSummary {
  service_income: number;
  service_cost: number;
  count: number;
}

export interface ManualInvoiceTransactionRow {
  id: number;
  invoice_number: string;
  transaction_id?: number | null;
  transaction_date?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  exchange_rate?: number | string | null;
  issued_at?: string | null;
  pdf_url?: string | null;
  class_student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  customer_name?: string | null;
  service_name?: string | null;
  service_cost?: number | string | null;
}

export interface UpcomingInstallmentRow {
  id: number;
  class_id?: number | null;
  student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  father_name?: string | null;
  phone_number?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  next_due_date?: string | null;
  days_overdue?: number;
  is_overdue?: boolean;
  balance_due?: number;
  net_amount?: number;
  paid_amount?: number;
  mof_receivable_amount?: number;
  other_receivable_amount?: number;
  last_payment_date?: string | null;
  payment_status?: string | null;
  payment_status_label?: string | null;
  currency?: string | null;
  invoice_id?: number | null;
  invoice_number?: string | null;
  pdf_url?: string | null;
}

export type FinancialTransactionFilter =
  | "irrecoverable"
  | "mof"
  | "pending"
  | "refund"
  | "payment"
  | "recovery"
  | "write_off"
  | "cancellation"
  | "other";

export type TransactionPayer = "student" | "mof" | "other_party";

export type DuesBucket = "all" | "overdue" | "week" | "upcoming" | "no_date";

export interface DuesCounts {
  overdue: number;
  week: number;
  upcoming: number;
  no_date: number;
  all: number;
}

export interface FinancialTransactionTotals {
  count: number;
  collected: number;
  refunded: number;
  net_cash: number;
  written_off: number;
  write_off_reversed: number;
  cancelled: number;
}

export interface FinancialTransactionRow {
  id: number;
  class_student_id?: number | null;
  type?: string | null;
  type_label?: string | null;
  transaction_type?: string | null;
  transaction_type_label?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  exchange_rate?: number | string | null;
  transaction_date?: string | null;
  next_installment_date?: string | null;
  invoice_id?: number | null;
  invoice_number?: string | null;
  pdf_url?: string | null;
  notes?: string | null;
  service_name?: string | null;
  service_cost?: number | string | null;
  internal_notes?: string | null;
  student_name?: string | null;
  student_code?: string | null;
  father_name?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  teacher_name?: string | null;
  payment_status?: string | null;
  payment_status_label?: string | null;
  mof_receivable_amount?: number | string | null;
  irrecoverable_debt?: number | string | null;
  payer?: string | null;
  payer_label?: string | null;
  related_transaction_id?: number | null;
  is_recovery?: boolean;
  created_by?: number | null;
  created_at?: string | null;
}

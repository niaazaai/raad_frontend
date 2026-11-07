import { lazy } from "react";
import type { ProtectedRouteType } from "@/types/routes";

const FinanceReportPage = lazy(() => import("../features/FinanceReportPage/FinanceReportPage"));
const ReceivePaymentPage = lazy(() => import("../features/ReceivePaymentPage/ReceivePaymentPage"));
const InvoicesPage = lazy(() => import("../features/InvoicesPage/InvoicesPage"));
const ManualInvoicePage = lazy(() => import("../features/ManualInvoicePage/ManualInvoicePage"));
const ManualInvoicesPage = lazy(() => import("../features/ManualInvoicesPage/ManualInvoicesPage"));
const UpcomingDuesPage = lazy(() => import("../features/UpcomingDuesPage/UpcomingDuesPage"));
const TransactionsPage = lazy(() => import("../features/TransactionsPage/TransactionsPage"));

export const FinanceRoutes: ProtectedRouteType[] = [
  {
    path: "/finance",
    component: <FinanceReportPage />,
    permission: "finance.read",
  },
  {
    path: "/finance/invoices",
    component: <InvoicesPage />,
    permission: "finance.invoices.read",
  },
  {
    path: "/finance/upcoming-dues",
    component: <UpcomingDuesPage />,
    permission: "finance.dues.read",
  },
  {
    path: "/finance/transactions",
    component: <TransactionsPage />,
    permission: "finance.read",
  },
  {
    path: "/finance/service-income",
    component: <ManualInvoicesPage />,
    permission: "finance.service_income.read",
  },
  {
    path: "/finance/manual-invoices",
    component: <ManualInvoicesPage />,
    permission: "finance.service_income.read",
  },
  {
    path: "/finance/manual-invoice",
    component: <ManualInvoicePage />,
    anyPermission: ["finance.manual_invoices.create", "finance.service_income.create"],
  },
  {
    path: "/finance/receive-payment",
    component: <ReceivePaymentPage />,
    permission: "finance.payments.receive",
  },
];

export default FinanceRoutes;

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
} from "./drawer";
import { Input } from "./input";
import { Label } from "./label";
import { useTranslation } from "@/i18n/useTranslation";
import {
  detectDateKey,
  downloadSpreadsheet,
  rowMatchesDateRange,
  rowValueAt,
  type DataTableExportQuery,
} from "@/lib/exportSpreadsheet";
import type { DataTableColumnConfig, DataTableConfig } from "@/types/datatable";

interface DataTableExportDrawerProps<T> {
  open: boolean;
  onClose: () => void;
  data: T[];
  config: DataTableConfig<T>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIsoDate(): string {
  return `${todayIsoDate().slice(0, 7)}-01`;
}

function exportableColumns<T>(columns: DataTableColumnConfig<T>[]): DataTableColumnConfig<T>[] {
  return columns.filter((column) => column.exportable !== false && column.key !== "actions");
}

function cellForColumn<T>(row: T, column: DataTableColumnConfig<T>): string | number {
  if (column.exportValue) {
    const value = column.exportValue(row);
    if (value == null) return "";
    return value;
  }
  return rowValueAt(row, column.key);
}

const DataTableExportDrawer = <T,>({ open, onClose, data, config }: DataTableExportDrawerProps<T>) => {
  const { t } = useTranslation();
  const columns = useMemo(() => exportableColumns(config.columns), [config.columns]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => columns.map((column) => column.key));
  const [allTime, setAllTime] = useState(true);
  const [from, setFrom] = useState(monthStartIsoDate());
  const [to, setTo] = useState(todayIsoDate());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedKeys(columns.map((column) => column.key));
    setAllTime(true);
    setFrom(monthStartIsoDate());
    setTo(todayIsoDate());
  }, [open, columns]);

  const dateKey = detectDateKey(config.columns, config.exportDateKey);

  const toggleColumn = (key: string, checked: boolean) => {
    setSelectedKeys((current) => {
      if (checked) return columns.map((column) => column.key).filter((item) => item === key || current.includes(item));
      return current.filter((item) => item !== key);
    });
  };

  const handleExport = async () => {
    const selected = columns.filter((column) => selectedKeys.includes(column.key));
    if (selected.length === 0) {
      toast.error(t("dataTable.exportNeedColumn"));
      return;
    }

    const query: DataTableExportQuery = allTime
      ? { allTime: true }
      : { allTime: false, from, to };

    setExporting(true);
    try {
      const rows = config.fetchExportRows
        ? await config.fetchExportRows(query)
        : data.filter((row) => rowMatchesDateRange(row, dateKey, query));

      downloadSpreadsheet(
        config.exportFilename || "export",
        selected.map((column) => column.header),
        rows.map((row) => selected.map((column) => cellForColumn(row, column)))
      );
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("dataTable.exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("dataTable.exportTitle")}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{t("dataTable.exportColumns")}</p>
            <div className="space-y-2">
              {columns.map((column) => {
                const checked = selectedKeys.includes(column.key);
                return (
                  <label key={column.key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggleColumn(column.key, value === true)}
                    />
                    <span>{column.header}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{t("dataTable.exportDateRange")}</p>
            <div className="inline-flex rounded-lg border border-border p-1">
              <Button type="button" size="sm" variant={allTime ? "default" : "ghost"} onClick={() => setAllTime(true)}>
                {t("dataTable.exportAllTime")}
              </Button>
              <Button type="button" size="sm" variant={!allTime ? "default" : "ghost"} onClick={() => setAllTime(false)}>
                {t("dataTable.exportCustomRange")}
              </Button>
            </div>
            {!allTime ? (
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="datatable-export-from">{t("finance.from")}</Label>
                  <Input
                    id="datatable-export-from"
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="datatable-export-to">{t("finance.to")}</Label>
                  <Input
                    id="datatable-export-to"
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={exporting}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={() => void handleExport()} loading={exporting}>
            {t("dataTable.exportNow")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DataTableExportDrawer;

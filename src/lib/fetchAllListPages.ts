import { RequestMethod } from "@/data/constants/methods";
import { callApi } from "@/services";
import type { DataTablePaginationMeta } from "@/types/datatable";
import type { DataTableExportQuery } from "@/lib/exportSpreadsheet";

interface FetchAllListPagesOptions<T> {
  url: string;
  params?: Record<string, unknown>;
  extractRows: (response: unknown) => T[];
  extractPagination?: (response: unknown) => DataTablePaginationMeta | null;
  query?: DataTableExportQuery;
}

export async function fetchAllListPages<T>({
  url,
  params = {},
  extractRows,
  extractPagination,
  query,
}: FetchAllListPagesOptions<T>): Promise<T[]> {
  const perPage = 250;
  const rows: T[] = [];
  let page = 1;
  // Safety stop only. 400 pages × 250 rows covers well past the old 250-row cap.
  const maxPages = 400;

  const dateParams = query
    ? query.allTime
      ? { all_time: 1 }
      : {
          from: query.from,
          to: query.to,
        }
    : {};

  do {
    const response = await callApi({
      url,
      method: RequestMethod.GET,
      params: {
        ...params,
        ...dateParams,
        page,
        per_page: perPage,
      },
      shouldPopError: false,
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Export failed");
    }

    rows.push(...extractRows(response.data));
    const pagination = extractPagination?.(response.data);
    const totalPages = Math.max(1, pagination?.total_pages ?? 1);
    const hasMore = pagination?.has_more_pages === true || page < totalPages;
    page += 1;
    if (!hasMore || page > maxPages) break;
  } while (page <= maxPages);

  return rows;
}

import { ParsedQs } from "qs";

type ListParams = {
  search?: string;
  status?: string[];
  tags?: string[];
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir: "asc" | "desc";
};

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

const parseArray = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
};

export const parseListParams = (
  query: ParsedQs,
  options: { defaultPageSize?: number; maxPageSize?: number } = {}
): ListParams => {
  const defaultPageSize = options.defaultPageSize ?? 10;
  const maxPageSize = options.maxPageSize ?? 200;
  const page = parseNumber(query.page, 1);
  const pageSize = Math.min(parseNumber(query.pageSize, defaultPageSize), maxPageSize);
  const sortDir = query.sortDir === "asc" ? "asc" : "desc";

  return {
    search: parseString(query.search),
    status: parseArray(query.status),
    tags: parseArray(query.tags),
    page,
    pageSize,
    sortBy: parseString(query.sortBy),
    sortDir,
  };
};

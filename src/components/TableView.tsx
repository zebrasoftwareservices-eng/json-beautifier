import { useState, useMemo } from "react";

type Row = Record<string, unknown>;

function getColumns(rows: Row[]): string[] {
  const cols = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) cols.add(key);
  }
  return Array.from(cols);
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

const PAGE_SIZE = 50;

export function TableView({ json }: { json: string }) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const { rows, columns, message } = useMemo(() => {
    if (!json.trim()) {
      return {
        rows: [],
        columns: [],
        message: "Format JSON to see the table view",
      };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return {
        rows: [],
        columns: [],
        message: "Table view requires valid JSON.",
      };
    }
    if (!Array.isArray(parsed)) {
      return {
        rows: [],
        columns: [],
        message:
          "Table view requires an array — the current output is an object or primitive.",
      };
    }
    if (parsed.length === 0) {
      return {
        rows: [],
        columns: [],
        message: "Empty array — nothing to display.",
      };
    }
    const hasObjects = parsed.some(
      (r) => r !== null && typeof r === "object" && !Array.isArray(r),
    );
    if (!hasObjects) {
      return {
        rows: [],
        columns: [],
        message:
          "Table view requires an array of objects — found an array of primitives or arrays.",
      };
    }
    const objRows = parsed.filter(
      (r): r is Row => r !== null && typeof r === "object" && !Array.isArray(r),
    );
    return { rows: objRows, columns: getColumns(objRows), message: null };
  }, [json]);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = formatCell(a[sortKey]);
      const bv = formatCell(b[sortKey]);
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(col: string) {
    if (sortKey === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortDir("asc");
    }
    setPage(0);
  }

  if (message) {
    return <div className="table-view-empty">{message}</div>;
  }

  return (
    <div className="table-view">
      <div className="table-view__scroll">
        <table className="table-view__table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className={`table-view__th${sortKey === col ? " table-view__th--sorted" : ""}`}
                  onClick={() => handleSort(col)}
                  title={`Sort by ${col}`}
                >
                  {col}
                  {sortKey === col ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "table-view__tr--even" : ""}>
                {columns.map((col) => (
                  <td key={col} className="table-view__td">
                    {formatCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="table-view__pagination">
          <button
            className="secondary"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
          >
            ←
          </button>
          <span className="table-view__page-info">
            Page {page + 1} / {totalPages} · {rows.length} rows
          </span>
          <button
            className="secondary"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            aria-label="Next page"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

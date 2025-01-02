import * as React from "react";
import { Download } from "lucide-react";
import { BusinessResult } from "../types";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { downloadCSV } from "../utils/csvExport";

interface TableProps {
  results: BusinessResult[];
  handleLinkClick: (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string
  ) => void;
}

type SortDirection = "asc" | "desc";

export const Table: React.FC<TableProps> = ({ results, handleLinkClick }) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof BusinessResult;
    direction: SortDirection;
  } | null>(null);

  const handleSort = (key: keyof BusinessResult) => {
    let direction: SortDirection = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = React.useMemo(() => {
    if (!sortConfig) return results;

    return [...results].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [results, sortConfig]);

  return (
    <div className="rounded-lg border shadow-sm">
      {results.length > 0 && (
        <div className="p-4 border-b flex justify-end">
          <button
            onClick={() => downloadCSV(sortedResults)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      )}
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader onSort={handleSort} sortConfig={sortConfig} />
          <tbody className="[&_tr:last-child]:border-0">
            {sortedResults.map((result, index) => (
              <TableRow
                key={index}
                result={result}
                handleLinkClick={handleLinkClick}
                isEven={index % 2 === 0}
              />
            ))}
            {sortedResults.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-4 text-center text-muted-foreground"
                >
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

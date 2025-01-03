import * as React from "react";
import { Download } from "lucide-react";
import { BusinessResult } from "../types";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { downloadCSV } from "../utils/csvExport";
import { Filter } from "./Filter";
import { Pagination } from "./Pagination";

interface TableProps {
  results: BusinessResult[];
  handleLinkClick: (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string
  ) => void;
}

type SortDirection = "asc" | "desc";
type FilterOperator = "contains" | "not_contains";

interface FilterCondition {
  value: string;
  operator: FilterOperator;
}

export const Table: React.FC<TableProps> = ({ results, handleLinkClick }) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof BusinessResult;
    direction: SortDirection;
  } | null>(null);
  const [filters, setFilters] = React.useState<
    Record<keyof BusinessResult, FilterCondition>
  >({
    name: { value: "", operator: "contains" },
    address: { value: "", operator: "contains" },
    phone: { value: "", operator: "contains" },
    website: { value: "", operator: "contains" },
    email: { value: "", operator: "contains" },
    instagram: { value: "", operator: "contains" },
    facebook: { value: "", operator: "contains" },
    twitter: { value: "", operator: "contains" },
    whatsapp: { value: "", operator: "contains" },
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const handleSort = (key: keyof BusinessResult) => {
    let direction: SortDirection = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedResults = React.useMemo(() => {
    let filtered = results;

    // Apply filters
    if (Object.values(filters).some((f) => f.value)) {
      filtered = results.filter((result) => {
        return Object.entries(filters).every(([key, condition]) => {
          if (!condition.value) return true;
          const resultValue =
            result[key as keyof BusinessResult]?.toLowerCase() || "";
          const filterValue = condition.value.toLowerCase();

          return condition.operator === "contains"
            ? resultValue.includes(filterValue)
            : !resultValue.includes(filterValue);
        });
      });
    }

    // Apply sorting
    if (!sortConfig) return filtered;

    return [...filtered].sort((a, b) => {
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
  }, [results, sortConfig, filters]);

  // Get current page items
  const currentItems = filteredAndSortedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="rounded-lg border shadow-sm">
      {results.length > 0 && (
        <>
          <div className="p-4 border-b flex justify-end">
            <button
              onClick={() => downloadCSV(filteredAndSortedResults)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </button>
          </div>
          <Filter onFilterChange={setFilters} />
        </>
      )}
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader onSort={handleSort} sortConfig={sortConfig} />
          <tbody className="[&_tr:last-child]:border-0">
            {currentItems.map((result, index) => (
              <TableRow
                key={index}
                result={result}
                handleLinkClick={handleLinkClick}
                isEven={index % 2 === 0}
              />
            ))}
            {currentItems.length === 0 && (
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
      {filteredAndSortedResults.length > itemsPerPage && (
        <Pagination
          totalItems={filteredAndSortedResults.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

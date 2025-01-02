import * as React from "react";
import { Filter as FilterIcon, X } from "lucide-react";
import { BusinessResult } from "../types";

type FilterOperator = "contains" | "not_contains";

interface FilterCondition {
  value: string;
  operator: FilterOperator;
}

interface FilterProps {
  onFilterChange: (
    filters: Record<keyof BusinessResult, FilterCondition>
  ) => void;
}

export const Filter: React.FC<FilterProps> = ({ onFilterChange }) => {
  const [isVisible, setIsVisible] = React.useState(false);
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
  });

  const visibleFields = ["name", "address"];

  const handleInputChange = (
    field: keyof BusinessResult,
    value: string,
    operator: FilterOperator
  ) => {
    const newFilters = {
      ...filters,
      [field]: { value, operator },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="border-b">
      <div className="p-4 flex justify-between items-center">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <FilterIcon className="w-4 h-4" />
          {isVisible ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {isVisible && (
        <div className="p-4 grid grid-cols-2 gap-4 border-t">
          {visibleFields.map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium block text-gray-600 capitalize">
                {field}
              </label>
              <div className="flex gap-2">
                <select
                  value={filters[field as keyof BusinessResult].operator}
                  onChange={(e) =>
                    handleInputChange(
                      field as keyof BusinessResult,
                      filters[field as keyof BusinessResult].value,
                      e.target.value as FilterOperator
                    )
                  }
                  className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  <option value="contains">Contains</option>
                  <option value="not_contains">Does not contain</option>
                </select>
                <input
                  type="text"
                  value={filters[field as keyof BusinessResult].value}
                  onChange={(e) =>
                    handleInputChange(
                      field as keyof BusinessResult,
                      e.target.value,
                      filters[field as keyof BusinessResult].operator
                    )
                  }
                  placeholder={`Filter by ${field}`}
                  className="flex-1 h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
                {filters[field as keyof BusinessResult].value && (
                  <button
                    onClick={() =>
                      handleInputChange(
                        field as keyof BusinessResult,
                        "",
                        filters[field as keyof BusinessResult].operator
                      )
                    }
                    className="p-1 hover:bg-secondary rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

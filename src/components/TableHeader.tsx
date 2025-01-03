import * as React from "react";
import {
  Mail,
  Facebook,
  Twitter,
  Instagram,
  ArrowUpDown,
  MessageCircle,
} from "lucide-react";
import { BusinessResult } from "../types";

interface TableHeaderProps {
  onSort: (key: keyof BusinessResult) => void;
  sortConfig: {
    key: keyof BusinessResult;
    direction: "asc" | "desc";
  } | null;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  onSort,
  sortConfig,
}) => {
  const headers = [
    {
      key: "name" as keyof BusinessResult,
      label: "Name",
      width: "200px",
      icon: null,
    },
    {
      key: "address" as keyof BusinessResult,
      label: "Address",
      width: "300px",
      icon: null,
    },
    {
      key: "phone" as keyof BusinessResult,
      label: "Phone",
      width: "150px",
      icon: null,
    },
    {
      key: "website" as keyof BusinessResult,
      label: "Website",
      width: "200px",
      icon: null,
    },
    {
      key: "email" as keyof BusinessResult,
      label: "Email",
      width: "200px",
      icon: <Mail className="w-4 h-4" />,
    },
    {
      key: "facebook" as keyof BusinessResult,
      label: "Facebook",
      width: "60px",
      icon: <Facebook className="w-4 h-4" />,
    },
    {
      key: "twitter" as keyof BusinessResult,
      label: "Twitter",
      width: "60px",
      icon: <Twitter className="w-4 h-4" />,
    },
    {
      key: "instagram" as keyof BusinessResult,
      label: "Instagram",
      width: "60px",
      icon: <Instagram className="w-4 h-4" />,
    },
    {
      key: "whatsapp" as keyof BusinessResult,
      label: "WhatsApp",
      width: "60px",
      icon: <MessageCircle className="w-4 h-4" />,
    },
  ];

  return (
    <thead className="[&_tr]:border-b">
      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
        {headers.map((header) => (
          <th
            key={header.key}
            className="h-12 px-4 text-left align-middle font-medium cursor-pointer group"
            style={{ minWidth: header.width }}
            onClick={() => onSort(header.key)}
          >
            <div className="flex items-center gap-2">
              {header.icon}
              {!header.icon && header.label}
              <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              {sortConfig?.key === header.key && (
                <span className="ml-1">
                  {sortConfig.direction === "asc" ? "↑" : "↓"}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

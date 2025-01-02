import * as React from "react";
import { Mail, Facebook, Twitter, Instagram } from "lucide-react";
import { BusinessResult } from "../types";

interface TableRowProps {
  result: BusinessResult;
  handleLinkClick: (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string
  ) => void;
  isEven: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  result,
  handleLinkClick,
  isEven,
}) => {
  const formatPhoneLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    return `tel:${cleanPhone}`;
  };

  const formatWebsiteLink = (website: string) => {
    return website.startsWith("http") ? website : `https://${website}`;
  };

  return (
    <tr
      className={`${
        isEven ? "bg-muted/50" : "bg-white"
      } transition-colors hover:bg-muted/80`}
    >
      <td className="p-4 align-middle font-medium">{result.name}</td>
      <td className="p-4 align-middle text-muted-foreground">
        {result.address}
      </td>
      <td className="p-4 align-middle">
        {result.phone && (
          <a
            href={formatPhoneLink(result.phone)}
            onClick={(e) => handleLinkClick(e, formatPhoneLink(result.phone!))}
            className="text-blue-600 hover:underline hover:text-blue-800"
          >
            {result.phone}
          </a>
        )}
      </td>
      <td className="p-4 align-middle">
        {result.website && (
          <a
            href={formatWebsiteLink(result.website)}
            onClick={(e) =>
              handleLinkClick(e, formatWebsiteLink(result.website!))
            }
            className="text-blue-600 hover:underline hover:text-blue-800 truncate max-w-[200px] block"
          >
            {result.website}
          </a>
        )}
      </td>
      <td className="p-4 align-middle">
        {result.email && (
          <a
            href={`mailto:${result.email}`}
            onClick={(e) => handleLinkClick(e, `mailto:${result.email}`)}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Mail className="w-4 h-4" />
            <span className="truncate max-w-[150px]">{result.email}</span>
          </a>
        )}
      </td>
      <td className="p-4 align-middle">
        {result.facebook && (
          <a
            href={result.facebook}
            onClick={(e) => handleLinkClick(e, result.facebook!)}
            className="inline-flex items-center justify-center w-8 h-8 text-[#1877F2] hover:bg-[#1877F2]/10 rounded-full transition-colors"
          >
            <Facebook className="w-5 h-5" />
          </a>
        )}
      </td>
      <td className="p-4 align-middle">
        {result.twitter && (
          <a
            href={result.twitter}
            onClick={(e) => handleLinkClick(e, result.twitter!)}
            className="inline-flex items-center justify-center w-8 h-8 text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-full transition-colors"
          >
            <Twitter className="w-5 h-5" />
          </a>
        )}
      </td>
      <td className="p-4 align-middle">
        {result.instagram && (
          <a
            href={result.instagram}
            onClick={(e) => handleLinkClick(e, result.instagram!)}
            className="inline-flex items-center justify-center w-8 h-8 text-[#E4405F] hover:bg-[#E4405F]/10 rounded-full transition-colors"
          >
            <Instagram className="w-5 h-5" />
          </a>
        )}
      </td>
    </tr>
  );
};

import { BusinessResult } from "../types";

export const convertToCSV = (results: BusinessResult[]): string => {
  const headers = [
    "Name",
    "Address",
    "Phone",
    "Website",
    "Email",
    "Facebook",
    "Twitter",
    "Instagram",
  ];

  const rows = results.map((result) => [
    result.name,
    result.address,
    result.phone || "",
    result.website || "",
    result.email || "",
    result.facebook || "",
    result.twitter || "",
    result.instagram || "",
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
};

export const downloadCSV = (results: BusinessResult[]) => {
  const csv = convertToCSV(results);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "business_results.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

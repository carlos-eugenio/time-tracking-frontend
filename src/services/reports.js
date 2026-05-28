import { http } from "./http";

export async function listTimeEntriesReport({
  startDate,
  endDate,
  employeeId = null,
  sort = "date",
  direction = "asc",
  page = 1,
  perPage = 15,
} = {}) {
  const params = {
    start_date: startDate,
    end_date: endDate,
    sort,
    direction,
    page,
    per_page: perPage,
  };
  if (employeeId) params.employee_id = employeeId;

  const res = await http.get("reports/time-entries", { params });
  return res.data;
}

function parseFilename(contentDisposition) {
  if (!contentDisposition) return null;
  const cd = String(contentDisposition);

  const utf8 = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return utf8[1].trim().replace(/^"|"$/g, "");
    }
  }

  const simple = cd.match(/filename\s*=\s*([^;]+)/i);
  if (simple?.[1]) return simple[1].trim().replace(/^"|"$/g, "");
  return null;
}

export async function exportTimeEntriesReport({
  startDate,
  endDate,
  employeeId = null,
  sort = "date",
  direction = "asc",
  format,
} = {}) {
  const params = {
    start_date: startDate,
    end_date: endDate,
    sort,
    direction,
    format,
  };
  if (employeeId) params.employee_id = employeeId;

  const acceptByFormat = {
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pdf: "application/pdf",
  };

  const res = await http.get("reports/time-entries/export", {
    params,
    responseType: "blob",
    headers: {
      Accept: acceptByFormat[format] || "application/octet-stream",
    },
  });

  const filename =
    parseFilename(res.headers?.["content-disposition"]) ||
    `time-entries-${startDate}_to_${endDate}.${format}`;

  return { blob: res.data, filename, contentType: res.headers?.["content-type"] };
}


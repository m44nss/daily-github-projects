const FIELDS = [
  ["source", "utm_source"], ["medium", "utm_medium"],
  ["campaign", "utm_campaign"], ["term", "utm_term"], ["content", "utm_content"]
];

export function buildCampaignUrl(values) {
  const raw = String(values.website || "").trim();
  if (!raw) throw new Error("Enter a destination URL.");
  let url;
  try { url = new URL(raw); }
  catch { throw new Error("Enter a valid full URL, including https://."); }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS destination URLs are supported.");
  }
  for (const required of ["source", "medium", "campaign"]) {
    if (!String(values[required] || "").trim()) {
      throw new Error("Source, medium and campaign are required.");
    }
  }
  let count = 0;
  for (const [field, parameter] of FIELDS) {
    const value = String(values[field] || "").trim();
    if (!value) continue;
    url.searchParams.set(parameter, value);
    count++;
  }
  return { url: url.toString(), parameterCount: count };
}

export function toCsv(rows) {
  const columns = ["campaign", "source", "medium", "term", "content", "destination", "taggedUrl", "createdAt"];
  const escape = value => '"' + String(value ?? "").replaceAll('"', '""') + '"';
  return [columns.join(","), ...rows.map(row => columns.map(key => escape(row[key])).join(","))].join("\r\n");
}

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

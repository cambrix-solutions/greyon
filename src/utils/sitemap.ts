export type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

export function buildCmsSitemapEntries(input: {
  hotels: Array<{ slug: string }>;
  locations: Array<{ slug: string }>;
  news: Array<{ slug: string; publishedAt?: string }>;
}): SitemapEntry[] {
  const list: SitemapEntry[] = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/hotels", changefreq: "weekly", priority: "0.9" },
    { loc: "/locations", changefreq: "weekly", priority: "0.8" },
    { loc: "/news", changefreq: "weekly", priority: "0.7" },
    { loc: "/booking", changefreq: "monthly", priority: "0.8" },
    { loc: "/contact", changefreq: "monthly", priority: "0.6" },
    { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
    { loc: "/terms", changefreq: "yearly", priority: "0.3" },
    { loc: "/booking-terms", changefreq: "yearly", priority: "0.3" }
  ];
  for (const hotel of input.hotels) {
    list.push({
      loc: `/hotels/${hotel.slug}`,
      changefreq: "weekly",
      priority: "0.8"
    });
  }
  for (const loc of input.locations) {
    list.push({
      loc: `/locations/${loc.slug}`,
      changefreq: "monthly",
      priority: "0.7"
    });
  }
  for (const article of input.news) {
    list.push({
      loc: `/news/${article.slug}`,
      ...(article.publishedAt ? { lastmod: article.publishedAt } : {}),
      changefreq: "monthly",
      priority: "0.6"
    });
  }
  return list;
}

export function buildSitemapXml(
  baseUrl: string,
  entries: SitemapEntry[]
): string {
  const origin = baseUrl.replace(/\/$/, "");
  const urls = entries
    .map(entry => {
      const loc = entry.loc.startsWith("http")
        ? entry.loc
        : `${origin}${entry.loc.startsWith("/") ? "" : "/"}${entry.loc}`;
      return `  <url>
    <loc>${escapeXml(loc)}</loc>${
      entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""
    }${
      entry.changefreq
        ? `\n    <changefreq>${entry.changefreq}</changefreq>`
        : ""
    }${entry.priority ? `\n    <priority>${entry.priority}</priority>` : ""}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

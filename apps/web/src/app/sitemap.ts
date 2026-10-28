import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: new Date("2026-10-27"),
    },
    {
      url: `${site.url}/privacy`,
      lastModified: new Date("2026-10-27"),
    },
  ];
}

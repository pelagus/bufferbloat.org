import type { MetadataRoute } from "next";

const lastModified = new Date("2026-07-13T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://bufferbloat.org",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://bufferbloat.org/test",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: "https://bufferbloat.org/docs",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://bufferbloat.org/learn",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: "https://bufferbloat.org/learn/latency-under-load",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://bufferbloat.org/learn/bufferbloat-speed-test",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://bufferbloat.org/mission",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://bufferbloat.org/cli",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.35,
    },
  ];
}

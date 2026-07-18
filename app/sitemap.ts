import type { MetadataRoute } from "next";

const lastModified = new Date("2026-07-15T00:00:00.000Z");

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
      url: "https://bufferbloat.org/learn/latency-spread-vs-jitter",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://bufferbloat.org/learn/median-ping-vs-average-ping",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.68,
    },
    {
      url: "https://bufferbloat.org/learn/technical-details-export",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.66,
    },
    {
      url: "https://bufferbloat.org/learn/internet-latency-test",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://bufferbloat.org/learn/internet-reliability-test",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://bufferbloat.org/learn/internet-stability-test",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://bufferbloat.org/learn/calls-internet-test",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://bufferbloat.org/learn/gaming-network-test",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://bufferbloat.org/learn/zoom-internet-test",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://bufferbloat.org/learn/video-meeting-test-results",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.68,
    },
    {
      url: "https://bufferbloat.org/learn/internet-connection-quality",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: "https://bufferbloat.org/learn/what-bufferbloat-speed-test-measures",
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
      url: "https://bufferbloat.org/privacy",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.45,
    },
    {
      url: "https://bufferbloat.org/contact",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: "https://bufferbloat.org/cli",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.35,
    },
  ];
}

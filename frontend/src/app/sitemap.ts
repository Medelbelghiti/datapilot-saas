export default function sitemap() {
  const base = "https://datapilot.ai";
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/login`, lastModified: new Date() },
    { url: `${base}/signup`, lastModified: new Date() },
    { url: `${base}/privacy`, lastModified: new Date() },
    { url: `${base}/terms`, lastModified: new Date() },
    { url: `${base}/contact`, lastModified: new Date() },
    { url: `${base}/methodology`, lastModified: new Date() },
    { url: `${base}/faq`, lastModified: new Date() },
  ];
}

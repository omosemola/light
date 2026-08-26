import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/product/",
          "/category/",
          "/vendor/",
          "/search",
          "/support",
        ],
        disallow: [
          "/admin/",
          "/vendor/dashboard/",
          "/api/",
          "/profile/",
          "/checkout/",
          "/orders/",
        ],
      },
    ],
    sitemap: "https://lightsonmarketplace.com/sitemap.xml",
  };
}

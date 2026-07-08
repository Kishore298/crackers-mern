const fs = require('fs');
const axios = require('axios');
const path = require('path');

const API_BASE = process.env.REACT_APP_API_URL || "https://api.vcrackers.in/api";
const SITE_URL = "https://vcrackers.in";

async function generateSitemap() {
  console.log("Generating sitemap...");
  let products = [];

  try {
    // Fetch with high limit to bypass pagination and get all products
    const response = await axios.get(`${API_BASE}/products?limit=1000`, { timeout: 15000 });
    if (response.data && response.data.success) {
      products = response.data.products || response.data.data || [];
    } else if (Array.isArray(response.data)) {
      products = response.data;
    } else if (response.data && Array.isArray(response.data.products)) {
      products = response.data.products;
    }
    console.log(`Fetched ${products.length} products for sitemap.`);
  } catch (error) {
    console.warn("Could not fetch products for dynamic sitemap generation.", error.message);
    console.warn("Continuing with static routes only.");
  }

  const staticRoutes = [
    "",
    "/products",
    "/cart",
    "/login",
    "/register",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/shipping-policy",
    "/refund-policy",
    "/safety-guidelines"
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map(route => `  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`).join("\n")}
${products.map(p => {
    const slug = p.slug || p._id;
    if (!slug) return "";
    return `  <url>
    <loc>${SITE_URL}/products/${slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  }).filter(Boolean).join("\n")}
</urlset>`;

  const publicPath = path.join(__dirname, 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, sitemap.trim() + '\n');
  console.log(`Sitemap successfully generated at ${publicPath}`);
}

generateSitemap();
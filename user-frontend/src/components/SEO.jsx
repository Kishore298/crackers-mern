import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  keywords = "festive products, diwali gifts, buy celebration packs, sivakasi products, v crackers",
  schemaMarkup
}) => {
  const siteName = "V Crackers";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = "V Crackers - Sivakasi's most trusted festive brand. Buy premium quality celebration packs, gift boxes, and festive items online at the best prices.";
  const metaDescription = description || defaultDescription;
  const url = window.location.href;
  const image = ogImage || `${window.location.origin}/festive-banner.webp`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />

      {/* Schema.org JSON-LD */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

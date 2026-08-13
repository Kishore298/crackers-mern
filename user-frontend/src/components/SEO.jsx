import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  schemaMarkup,
  noindex = false
}) => {
  const siteName = "V Crackers";
  const fullTitle = title ? `${title} | ${siteName}` : `Sivakasi Crackers & Fireworks Online | ${siteName}`;
  const defaultDescription = "V Crackers is a Sivakasi-based crackers and fireworks store offering a wide range of fireworks, gift boxes, and combo packs with delivery across all states in India.";
  const metaDescription = description || defaultDescription;
  const url = window.location.href;
  const image = ogImage || `${window.location.origin}/v-crackers-logo.webp`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
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
        Array.isArray(schemaMarkup)
          ? schemaMarkup.map((schema, i) => (
              <script key={i} type="application/ld+json">
                {JSON.stringify(schema)}
              </script>
            ))
          : (
              <script type="application/ld+json">
                {JSON.stringify(schemaMarkup)}
              </script>
            )
      )}
    </Helmet>
  );
};

export default SEO;

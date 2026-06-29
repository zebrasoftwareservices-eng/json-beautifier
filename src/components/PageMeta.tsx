import { Helmet } from "react-helmet-async";

interface FaqItem {
  question: string;
  answer: string;
}

interface PageMetaProps {
  title: string;
  description: string;
  canonical: string;
  faq?: FaqItem[];
}

export function PageMeta({
  title,
  description,
  canonical,
  faq,
}: PageMetaProps) {
  const faqSchema = faq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {faqSchema && (
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      )}
    </Helmet>
  );
}

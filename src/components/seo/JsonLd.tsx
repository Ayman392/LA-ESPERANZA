type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

// Escaping "<" prevents user-authored product text from closing the script tag.
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

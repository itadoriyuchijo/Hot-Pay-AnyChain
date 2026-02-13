import { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
};

function upsertMeta(name: string, content: string, attr: "name" | "property" = "name") {
  const selector = attr === "name" ? `meta[name="${name}"]` : `meta[property="${name}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function Seo({ title, description, ogTitle, ogDescription }: SeoProps) {
  useEffect(() => {
    document.title = title;

    if (description) {
      upsertMeta("description", description, "name");
    }

    upsertMeta("og:title", ogTitle ?? title, "property");
    if (ogDescription ?? description) {
      upsertMeta("og:description", (ogDescription ?? description) as string, "property");
    }
    upsertMeta("og:type", "website", "property");
  }, [title, description, ogTitle, ogDescription]);

  return null;
}

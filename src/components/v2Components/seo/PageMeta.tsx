import { usePageMeta, type PageMeta as PageMetaProps } from "../../../utils/v2Utils/seo";

// Route-level head tags. Put next to a page element in App.tsx; detail pages
// that know their own title call usePageMeta directly instead.
export default function PageMeta(props: PageMetaProps) {
  usePageMeta(props);
  return null;
}

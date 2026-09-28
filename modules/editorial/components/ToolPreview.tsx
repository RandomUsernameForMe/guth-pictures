import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { EditorialImage } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";

type Props = {
  locale: string;
  image: EditorialImage;
  fallback: string;
  title: string;
  description: string;
  href: "/foceni-101" | "/light-tester";
  cta: string;
  notice?: string;
};

export function ToolPreview({ locale, image, fallback, title, description, href, cta, notice }: Props) {
  return (
    <article className="ed-tool">
      <div className="ed-tool__image">
        {image.publicId ? (
          <EditorialImageView image={image} locale={locale} sizes="(max-width: 760px) 100vw, 50vw" />
        ) : (
          <Image src={fallback} alt="" fill sizes="(max-width: 760px) 100vw, 50vw" className="editorial-image" />
        )}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {notice && <p className="ed-tool__notice">{notice}</p>}
      <Link href={href}>{cta}</Link>
    </article>
  );
}

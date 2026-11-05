import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/lib/utils";

export type ProductCardData = {
  name: string;
  image?: string | null;
  priceText?: string | null;
  affiliateUrl: string;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="flex gap-4 border-y py-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-sm bg-muted sm:size-28">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="112px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div>
          <p className="line-clamp-2 font-medium">{product.name}</p>
          {product.priceText && (
            <p className="mt-0.5 font-heading text-lg font-bold text-gom-link">
              {product.priceText}
            </p>
          )}
        </div>
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="sponsored nofollow noopener"
          className={cn(buttonVariants({ size: "lg" }), "h-10 w-fit px-4")}
        >
          Xem trên Shopee
          <ArrowUpRight aria-hidden />
        </a>
      </div>
    </div>
  );
}

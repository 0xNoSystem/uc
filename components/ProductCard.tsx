import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatColorLabel } from "@/lib/products";

export type { Product };

type ProductCardProps = {
  product: Product;
  quantity: number;
  selectedColor?: string;
  onIncrement?: (productId: string, color?: string) => void;
  onDecrement?: (productId: string) => void;
  onColorSelect?: (productId: string, color: string) => void;
};

const CardContent = ({
  product,
  quantity,
  selectedColor,
  onIncrement,
  onDecrement,
  onColorSelect,
}: ProductCardProps) => {
  const colors = product.colors ?? ["#f5f5f5"];
  const activeColor = selectedColor ?? colors[0];

  return (
    <>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl">
        <Image
          src={product.primaryImage}
          alt={`${product.name} primary`}
          fill
          sizes="50vw"
          className="object-cover transition-opacity duration-300 group-hover:opacity-0"
        />
        <Image
          src={product.secondaryImage}
          alt={`${product.name} alternate`}
          fill
          sizes="50vw"
          className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        {product.badge ? (
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
            {product.badge}
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-col gap-2.5 px-1.5 text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="max-w-[75%]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
              UNDERCONTROL
            </p>
            <p className="mt-1 text-2xl font-semibold leading-tight">
              {product.name}
            </p>
          </div>
          <div className="text-lg text-right">
            {product.newPrice ? (
              <div className="ml-1 flex flex-col items-end text-lg font-semibold">
                <span className="text-3xl text-white">{product.newPrice}</span>
                <span className="text-lg text-white/50 line-through">
                  {product.price}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-white">
                {product.price}
              </span>
            )}
            <span className="mt-1 block text-[11px] font-semibold uppercase text-white/60">
              Limited
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {colors.map((color) => {
            const isActive = color === activeColor;
            return (
              <button
                type="button"
                key={color}
                className={`h-5 w-5 rounded-full border transition ${
                  isActive
                    ? "border-white ring ring-offset-1 ring-offset-black"
                    : "border-white/30"
                }`}
                style={{ backgroundColor: color }}
                aria-pressed={isActive}
                aria-label={`Select ${product.name} in ${color}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onColorSelect?.(product.id, color);
                }}
              />
            );
          })}
        </div>
        {colors.length > 1 ? (
          <p className="text-[14px] uppercase tracking-[0.14em] text-white/60">
            Color:{" "}
            <span className="text-white">{formatColorLabel(activeColor)}</span>
          </p>
        ) : null}

        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <p className="text-[12px] uppercase tracking-[0.28em] text-white/50">
            Delivery
          </p>
          <p className="text-[14px] font-semibold text-white">
            2-day express in Lebanon
          </p>
        </div>

        <div className="flex items-center justify-between rounded-full border border-white/20 bg-white/5 p-2 mt-4">
          <button
            type="button"
            className="h-12 w-12 rounded-full bg-white/10 text-lg font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDecrement?.(product.id);
            }}
            disabled={!onDecrement || quantity === 0}
          >
            −
          </button>
          <div className="flex flex-col items-center text-center">
            <span className="text-lg font-semibold">{quantity}</span>
            <span className="text-[12px] uppercase tracking-wide text-white/60">
              In Cart
            </span>
          </div>
          <button
            type="button"
            className="h-12 w-12 rounded-full bg-white text-lg font-semibold text-black transition hover:bg-gray-100 disabled:opacity-60"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onIncrement?.(product.id, activeColor);
            }}
            disabled={!onIncrement}
          >
            +
          </button>
        </div>
      </div>
    </>
  );
};

const cardClasses =
  "group block overflow-hidden rounded-xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur transition hover:-translate-y-1 hover:ring-white/30";

const ProductCard = (props: ProductCardProps) => {
  if (props.product.href) {
    return (
      <Link
        href={props.product.href}
        className={cardClasses}
      >
        <CardContent {...props} />
      </Link>
    );
  }

  return (
    <div className={cardClasses}>
      <CardContent {...props} />
    </div>
  );
};

export default ProductCard;

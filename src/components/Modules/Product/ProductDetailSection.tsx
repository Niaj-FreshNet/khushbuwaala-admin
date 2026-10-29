import { IProduct } from "@/types/product.types";
import ProductDetailsShell from "./ProductDetailsShell.server";

interface Props {
    product: Partial<IProduct>;
}

export default function ProductDetailSection({ product }: Props) {
    return (
        <ProductDetailsShell
            product={{
                ...product,
                description:
                    product.description ||
                    `Premium ${product.gender === "male" ? "men's" : "women's"} perfume from Khushbuwaala`,
            }}
        />
    );
}

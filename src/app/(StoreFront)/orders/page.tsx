import { Metadata } from "next";
import MyOrders from "./_components/MyOrders";

export const metadata: Metadata = {
    title: "My Orders | Khushbuwaala Perfumes",
    description: "View all your past and current perfume orders.",
    openGraph: {
        title: "My Orders | Khushbuwaala Perfumes",
        description: "View all your past and current perfume orders.",
        url: "https://www.khushbuwaala.com/orders",
    },
};

export default function () {
    return (
        <MyOrders />
    );
}
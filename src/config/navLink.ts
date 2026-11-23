// File: config/navLinks.ts

import {
  LayoutDashboard,
  Package,
  Plus,
  List,
  Tags,
  ShoppingCart,
  Warehouse,
  Newspaper,
  Calculator,
  Wallet,
  BookOpen,
  Boxes,
  ClipboardList,
  CreditCard,
  LucideListOrdered,
  BadgeDollarSign,
  Store,
  Users2,
  UserCog,
  Settings,
  UserCircle2,
  Truck,
} from "lucide-react";

import { MdCategory, MdReviews } from "react-icons/md";
import { GiPerfumeBottle } from "react-icons/gi";
import { GoReport } from "react-icons/go";

/** lucide-react and react-icons components (both take className) */
type NavIcon = React.ComponentType<{ className?: string }>;

interface NavLink {
  name: string;
  href: string;
  icon: NavIcon;
  roles: string[];
  subItems?: {
    name: string;
    href: string;
    icon: NavIcon;
    roles: string[];
  }[];
}

export const navLinks: NavLink[] = [
  // ================= DASHBOARD =================
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },

  // ================= POS & SALES =================
  {
    name: "Manual Sales",
    href: "#",
    icon: Store,
    roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Add Sales",
        href: "/sales/add-sales",
        icon: Plus,
        roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Bulk Sales",
        href: "/sales/bulk-sales",
        icon: ClipboardList,
        roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Sale List",
        href: "/sales",
        icon: List,
        roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN"],
      },
    ],
  },

  // ================= ORDERS =================
  {
    name: "Orders",
    href: "/orders",
    icon: LucideListOrdered,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Carts",
    href: "/carts",
    icon: ShoppingCart,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },

  // ================= CATALOG =================
  {
    name: "Products",
    href: "/products",
    icon: Package,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Categories",
    href: "/categories",
    icon: MdCategory,
    roles: ["ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Category List",
        href: "/categories",
        icon: Tags,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Fragrance Families",
        href: "/fragrance-families",
        icon: GiPerfumeBottle,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Materials",
        href: "/materials",
        icon: Boxes,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },

  // ================= INVENTORY =================
  {
    name: "Inventory",
    href: "/stock",
    icon: Warehouse,
    roles: ["ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Stock Management",
        href: "/stock",
        icon: Boxes,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Low Stock Alerts",
        href: "/stock/low-stock-alertz",
        icon: GoReport,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },

  // ================= FINANCIALS =================

  {
    name: "Investor",
    href: "/investor",
    icon: UserCog,
    roles: ["INVESTOR"],
  },
  {
    name: "Finance",
    href: "/finance",
    icon: Calculator,
    roles: ["SUPER_ADMIN", "INVESTOR"],
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    // Money Steadfast has paid us; cleared parcels become Completed + Paid (D-026)
    name: "Courier Payouts",
    href: "/courier-payouts",
    icon: Truck,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Expenses",
    href: "#",
    icon: Wallet,
    // Salesmen record shop expenses and see their own (the API limits them to their own records)
    roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Add Expense",
        href: "/expense/add",
        icon: Plus,
        roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Expense List",
        href: "/expense",
        icon: List,
        roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN"],
      },
    ],
  },
  {
    name: "Discounts",
    href: "/discounts",
    icon: BadgeDollarSign,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },

  // ================= CRM / CUSTOMERS =================
  {
    name: "Customers",
    href: "/customer-list",
    icon: Users2,
    // Admins handle orders and customers; the API already allowed them
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Reviews",
    href: "/reviews",
    icon: MdReviews,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },

  // ================= CONTENT =================
  {
    name: "Blogs",
    href: "#",
    icon: Newspaper,
    roles: ["ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Add Blog",
        href: "/blogs/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "All Blogs",
        href: "/blogs",
        icon: BookOpen,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },

  {
    name: "Manage Investor",
    href: "/manage-investor",
    icon: UserCog,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Manage Roles",
    href: "/role-manager",
    icon: Settings,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "My Account",
    href: "/account",
    icon: UserCircle2,
    roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN", "INVESTOR"],
  },
];
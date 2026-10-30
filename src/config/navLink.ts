// File: config/navLinks.ts

import {
  LayoutDashboard,
  Package,
  Plus,
  List,
  Tags,
  ShoppingCart,
  Receipt,
  Warehouse,
  Percent,
  Newspaper,
  Users,
  Calculator,
  Settings,
  UserCog,
  Wallet,
  BookOpen,
  Boxes,
  TrendingUp,
  ClipboardList,
  CreditCard,
  LucideListOrdered,
} from "lucide-react";

import { MdCategory } from "react-icons/md";
import { GiPerfumeBottle } from "react-icons/gi";
import { GoReport } from "react-icons/go";

interface NavLink {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
  subItems?: {
    name: string;
    href: string;
    icon: React.ComponentType<any>;
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

  // ================= PRODUCTS =================
  {
    name: "Products",
    href: "#",
    icon: Package,
    roles: ["ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Add Product",
        href: "/products/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Product List",
        href: "/products",
        icon: List,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },

  // ================= CATEGORIES =================
  {
    name: "Categories",
    href: "#",
    icon: MdCategory,
    roles: ["ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Add Category",
        href: "/categories/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Category List",
        href: "/categories",
        icon: Tags,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Add Fragrance Family",
        href: "/fragrance-families/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Fragrance Families List",
        href: "/fragrance-families",
        icon: GiPerfumeBottle,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Add Material",
        href: "/materials/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Materials List",
        href: "/materials",
        icon: Boxes,
        roles: ["ADMIN", "SUPER_ADMIN"],
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

  // ================= MANUAL SALES =================
  {
    name: "Manual Sales",
    href: "#",
    icon: Receipt,
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

  // ================= EXPENSE =================
  {
    name: "Expenses",
    href: "#",
    icon: Wallet,
    roles: ["ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Add Expense",
        href: "/expense/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Expense List",
        href: "/expense",
        icon: List,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },

  // ================= INVENTORY =================
  {
    name: "Inventory",
    href: "#",
    icon: Warehouse,
    roles: ["ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Add Stock",
        href: "/stock/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
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

  // ================= DISCOUNTS =================
  {
    name: "Discounts",
    href: "#",
    icon: Percent,
    roles: ["ADMIN", "SUPER_ADMIN"],
    subItems: [
      {
        name: "Add Discount",
        href: "/discounts/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Discounts & Promotions",
        href: "/discounts",
        icon: Tags,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },

  // ================= BLOG =================
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

  // ================= PEOPLE =================
  {
    name: "Reviews",
    href: "/reviews",
    icon: Users,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },

  // {
  //   name: "Suppliers",
  //   href: "#",
  //   icon: Users,
  //   roles: ["ADMIN", "SUPER_ADMIN"],
  //   subItems: [
  //     {
  //       name: "Add Supplier",
  //       href: "/suppliers/add",
  //       icon: Plus,
  //       roles: ["ADMIN", "SUPER_ADMIN"],
  //     },
  //     {
  //       name: "Suppliers List",
  //       href: "/suppliers",
  //       icon: List,
  //       roles: ["ADMIN", "SUPER_ADMIN"],
  //     },
  //   ],
  // },

  // ================= ANALYTICS =================
  // {
  //   name: "Analytics",
  //   href: "/analytics",
  //   icon: TrendingUp,
  //   roles: ["SUPER_ADMIN"],
  // },

  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },

  {
    name: "Customers",
    href: "/customer-list",
    icon: Users,
    roles: ["SUPER_ADMIN"],
  },

  // ================= ACCOUNT =================
  // {
  //   name: "Profile",
  //   href: "/admin-profile",
  //   icon: Settings,
  //   roles: ["SUPER_ADMIN"],
  // },
  // {
  //   name: "Passwords Change",
  //   href: "/admin-passwords",
  //   icon: UserCog,
  //   roles: ["SUPER_ADMIN"],
  // },

  // ================= FINANCE =================
  // {
  //   name: "Investors",
  //   href: "#",
  //   icon: Users,
  //   roles: ["SUPER_ADMIN"],
  //   subItems: [
  //     { name: "Add Investor", href: "/investors/add", icon: Plus, roles: ["SUPER_ADMIN"] },
  //     { name: "Investors List", href: "/investors", icon: List, roles: ["SUPER_ADMIN"] },
  //   ],
  // },

  // {
  //   name: "Financial Overview",
  //   href: "/financial-overview",
  //   icon: Calculator,
  //   roles: ["SUPER_ADMIN"],
  // },

  // {
  //   name: "Ledger",
  //   href: "/ledger",
  //   icon: BookOpen,
  //   roles: ["SUPER_ADMIN"],
  // },

  // {
  //   name: "User Management",
  //   href: "#",
  //   icon: UserCog,
  //   roles: ["SUPER_ADMIN"],
  //   subItems: [
  //     { name: "Add User", href: "/users/add", icon: Plus, roles: ["SUPER_ADMIN"] },
  //     { name: "Users List", href: "/users", icon: Users, roles: ["SUPER_ADMIN"] },
  //     { name: "Assign Roles", href: "/assign-roles", icon: Settings, roles: ["SUPER_ADMIN"] },
  //   ],
  // },
];
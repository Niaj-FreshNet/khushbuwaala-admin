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
    href: "/dashboard",
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
        href: "/dashboard/products/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Product List",
        href: "/dashboard/products",
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
        href: "/dashboard/categories/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Category List",
        href: "/dashboard/categories",
        icon: Tags,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Add Fragrance Family",
        href: "/dashboard/fragrance-families/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Fragrance Families List",
        href: "/dashboard/fragrance-families",
        icon: GiPerfumeBottle,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Add Material",
        href: "/dashboard/materials/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Materials List",
        href: "/dashboard/materials",
        icon: Boxes,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },

  // ================= ORDERS =================
  {
    name: "Orders",
    href: "/dashboard/orders",
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
        href: "/dashboard/sales/add-sales",
        icon: Plus,
        roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Bulk Sales",
        href: "/dashboard/sales/bulk-sales",
        icon: ClipboardList,
        roles: ["SALESMAN", "ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Sale List",
        href: "/dashboard/sales",
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
        href: "/dashboard/expense/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Expense List",
        href: "/dashboard/expense",
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
        href: "/dashboard/stock/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Stock Management",
        href: "/dashboard/stock",
        icon: Boxes,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Low Stock Alerts",
        href: "/dashboard/stock/low-stock-alertz",
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
        href: "/dashboard/discounts/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Discounts & Promotions",
        href: "/dashboard/discounts",
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
        href: "/dashboard/blogs/add",
        icon: Plus,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "All Blogs",
        href: "/dashboard/blogs",
        icon: BookOpen,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },

  // ================= PEOPLE =================
  {
    name: "Reviews",
    href: "/dashboard/reviews",
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
  //       href: "/dashboard/suppliers/add",
  //       icon: Plus,
  //       roles: ["ADMIN", "SUPER_ADMIN"],
  //     },
  //     {
  //       name: "Suppliers List",
  //       href: "/dashboard/suppliers",
  //       icon: List,
  //       roles: ["ADMIN", "SUPER_ADMIN"],
  //     },
  //   ],
  // },

  // ================= ANALYTICS =================
  // {
  //   name: "Analytics",
  //   href: "/dashboard/analytics",
  //   icon: TrendingUp,
  //   roles: ["SUPER_ADMIN"],
  // },

  {
    name: "Carts",
    href: "/dashboard/carts",
    icon: ShoppingCart,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },

  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },

  {
    name: "Customers",
    href: "/dashboard/customer-list",
    icon: Users,
    roles: ["SUPER_ADMIN"],
  },

  // ================= ACCOUNT =================
  // {
  //   name: "Profile",
  //   href: "/dashboard/admin-profile",
  //   icon: Settings,
  //   roles: ["SUPER_ADMIN"],
  // },
  // {
  //   name: "Passwords Change",
  //   href: "/dashboard/admin-passwords",
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
  //     { name: "Add Investor", href: "/dashboard/investors/add", icon: Plus, roles: ["SUPER_ADMIN"] },
  //     { name: "Investors List", href: "/dashboard/investors", icon: List, roles: ["SUPER_ADMIN"] },
  //   ],
  // },

  // {
  //   name: "Financial Overview",
  //   href: "/dashboard/financial-overview",
  //   icon: Calculator,
  //   roles: ["SUPER_ADMIN"],
  // },

  // {
  //   name: "Ledger",
  //   href: "/dashboard/ledger",
  //   icon: BookOpen,
  //   roles: ["SUPER_ADMIN"],
  // },

  // {
  //   name: "User Management",
  //   href: "#",
  //   icon: UserCog,
  //   roles: ["SUPER_ADMIN"],
  //   subItems: [
  //     { name: "Add User", href: "/dashboard/users/add", icon: Plus, roles: ["SUPER_ADMIN"] },
  //     { name: "Users List", href: "/dashboard/users", icon: Users, roles: ["SUPER_ADMIN"] },
  //     { name: "Assign Roles", href: "/dashboard/assign-roles", icon: Settings, roles: ["SUPER_ADMIN"] },
  //   ],
  // },
];
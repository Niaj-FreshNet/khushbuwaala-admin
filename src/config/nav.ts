import { CiFolderOn, CiSettings } from 'react-icons/ci';
import { FaUsers } from 'react-icons/fa';
import { FaCalculator, FaShop } from 'react-icons/fa6';
import { GiNewspaper } from 'react-icons/gi';
import { GoPlus, GoPlusCircle, GoReport } from 'react-icons/go';
import { LuCalendarDays } from 'react-icons/lu';
import { MdDetails, MdOutlineCategory, MdOutlinePayments } from 'react-icons/md';
import { PiNewspaperThin } from 'react-icons/pi';
import { RiDashboardFill } from 'react-icons/ri';

// User nav links (similar to original)
export const navLink = [
  {
    name: "My Profile",
    href: "/",
    icon: RiDashboardFill,
  },
  {
    name: "Order History",
    href: "//order-list",
    icon: LuCalendarDays,
  },
  {
    name: "Password Change",
    href: "//password",
    icon: CiSettings,
  }
];

// Enhanced Admin nav links for perfume e-commerce
// Added inventory management, suppliers, fragrance-specific categories, promotions, analytics
export const AdminNavLink = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: RiDashboardFill,
  },
  {
    name: "Categories & Fragrances",
    href: "#",
    icon: MdOutlineCategory,
    subItems: [
      {
        name: 'Add Category',
        href: '/admin/add-category',
        icon: GoPlusCircle,
      },
      {
        name: "Category List",
        href: "/admin/category-list",
        icon: MdOutlineCategory,
      },
      {
        name: "Add Fragrance Family",
        href: '/admin/add-fragrance-family',
        icon: GoPlus,
      },
      {
        name: "Fragrance Families List",
        href: '/admin/fragrance-families-list',
        icon: CiFolderOn,
      },
      {
        name: "Add Material/Ingredient",
        href: '/admin/add-material',
        icon: GoPlus,
      },
      {
        name: "Materials List",
        href: '/admin/material-list',
        icon: CiFolderOn,
      }
    ]
  },
  {
    name: "Products",
    href: "#",
    icon: FaShop,
    subItems: [
      {
        name: "Add Product",
        href: "/admin/add-product",
        icon: GoPlus,
      },
      {
        name: "Product List",
        href: "/admin/product-list",
        icon: FaShop,
      },
      {
        name: "Add Variant (Size/Scent)",
        href: "/admin/add-variant",
        icon: GoPlus,
      },
      {
        name: "Variants List",
        href: "/admin/variants-list",
        icon: MdDetails,
      }
    ]
  },
  {
    name: "Inventory",
    href: "#",
    icon: CiFolderOn,
    subItems: [
      {
        name: "Stock Management",
        href: "/admin/stock-management",
        icon: MdDetails,
      },
      {
        name: "Low Stock Alerts",
        href: "/admin/low-stock-alerts",
        icon: GoReport,
      }
    ]
  },
  {
    name: "Suppliers",
    href: "#",
    icon: FaUsers,
    subItems: [
      {
        name: "Add Supplier",
        href: "/admin/add-supplier",
        icon: GoPlus,
      },
      {
        name: "Suppliers List",
        href: "/admin/suppliers-list",
        icon: FaUsers,
      }
    ]
  },
  {
    name: "Orders",
    href: "/admin/order-list",
    icon: MdOutlinePayments,
  },
  {
    name: "Manual Sales",
    href: "#",
    icon: GoPlusCircle,
    subItems: [
      {
        name: "Add Sale",
        href: "/admin/add-sales",
        icon: GoPlus,
      },
      {
        name: "Bulk Sales",
        href: "/admin/bulk-sales",
        icon: GoPlusCircle,
      },
      {
        name: "Sale List",
        href: '/admin/sale-list',
        icon: MdDetails,
      },
      {
        name: "Sales Report",
        href: '/admin/sales-report',
        icon: GoReport,
      }
    ]
  },
  {
    name: "Expenses",
    href: "#",
    icon: GoPlusCircle,
    subItems: [
      {
        name: "Add Expense",
        href: "/admin/add-expense",
        icon: GoPlus,
      },
      {
        name: "Expense List",
        href: '/admin/expense-list',
        icon: MdDetails,
      },
      {
        name: "Expenses Report",
        href: '/admin/expense-report',
        icon: GoReport,
      }
    ]
  },
  {
    name: "Promotions & Discounts",
    href: "#",
    icon: GoPlusCircle,
    subItems: [
      {
        name: "Add Promotion",
        href: "/admin/add-promotion",
        icon: GoPlus,
      },
      {
        name: "Promotions List",
        href: "/admin/promotions-list",
        icon: MdDetails,
      }
    ]
  },
  {
    name: "Blog & Content",
    href: "#",
    icon: PiNewspaperThin,
    subItems: [
      { name: "Add Blog", href: "/admin/add-blog", icon: GoPlus },
      { name: "All Blogs", href: "/admin/all-blog", icon: GiNewspaper },
    ],
  },
  {
    name: "Reviews & Ratings",
    href: "/admin/reviews",
    icon: FaUsers,
  },
  {
    name: "Analytics & Reports",
    href: "/admin/analytics",
    icon: FaCalculator,
  },
  {
    name: "Ledger & Accounting",
    href: "/admin/ledger",
    icon: FaCalculator,
  },
  {
    name: "Customers",
    href: "/admin/customer-list",
    icon: FaUsers,
  },
  {
    name: "Profile",
    href: "/admin/admin-profile",
    icon: CiSettings,
  },
  {
    name: "Password Change",
    href: "/admin/password",
    icon: CiSettings,
  }
];
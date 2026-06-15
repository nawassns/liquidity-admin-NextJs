import {
  IconBuildingStore,
  IconCalendarEvent,
  IconCash,
  IconChartBar,
  IconCoin,
  IconDashboard,
  IconGift,
  IconReceipt2,
  IconReportAnalytics,
  IconShieldLock,
  IconShoppingCart,
  IconUsers,
  IconUserShield,
  IconWallet,
  IconBottle,
  IconArchive,
} from "@tabler/icons-react";
import type { NavItem } from "@/types/nav-item";

export const navLinks: NavItem[] = [
  { label: "Dashboard", icon: IconDashboard, link: "/dashboard" },
  { label: "Admins", icon: IconUserShield, link: "/dashboard/admins" },
  { label: "Users", icon: IconUsers, link: "/dashboard/users" },
  { label: "Outlets", icon: IconBuildingStore, link: "/dashboard/outlets" },
  { label: "Orders", icon: IconShoppingCart, link: "/dashboard/orders" },
  {
    label: "Vault",
    icon: IconBottle,
    initiallyOpened: true,
    links: [
      { label: "Items", link: "/dashboard/vault-items" },
      { label: "Outlet Pricing", link: "/dashboard/vault-outlets" },
      { label: "Orders", link: "/dashboard/vault-orders" },
    ],
  },
  { label: "Wallet", icon: IconWallet, link: "/dashboard/wallet" },
  { label: "Payments", icon: IconCash, link: "/dashboard/payments" },
  {
    label: "Outlet Transactions",
    icon: IconReceipt2,
    link: "/dashboard/outlet-transactions",
  },
  { label: "Revenue", icon: IconCoin, link: "/dashboard/revenue" },
  { label: "Referrals", icon: IconGift, link: "/dashboard/referrals" },
  { label: "Events", icon: IconCalendarEvent, link: "/dashboard/events" },
  { label: "Reports", icon: IconReportAnalytics, link: "/dashboard/reports" },
  { label: "Profile", icon: IconShieldLock, link: "/dashboard/profile" },
];

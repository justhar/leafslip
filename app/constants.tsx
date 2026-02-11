import {
  Leaf,
  Instagram,
  Facebook,
  Mail,
  Phone,
  ArrowUp,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export const ICONS = {
  Leaf: <Leaf size={20} />,
  Instagram: <Instagram size={18} />,
  Facebook: <Facebook size={18} />,
  Mail: <Mail size={18} />,
  Phone: <Phone size={18} />,
  ArrowUp: <ArrowUp size={14} />,
};

export const AIMS = [
  {
    id: 1,
    text: "Reduce food waste by 40% for Indonesian MSMEs through smart inventory tracking",
  },
  {
    id: 2,
    text: "Digitize paper receipts into actionable business intelligence",
  },
  { id: 3, text: "Empower small retailers with enterprise-grade analytics" },
  { id: 4, text: "Build sustainable supply chains for local communities" },
];

export const BENEFITS = [
  { id: 1, text: "Real-time stock level monitoring and alerts" },
  { id: 2, text: "AI-powered expiration date predictions" },
  { id: 3, text: "Automated reorder recommendations" },
  { id: 4, text: "Sales pattern analysis and forecasting" },
  { id: 5, text: "Multi-location inventory synchronization" },
  { id: 6, text: "Paperless record keeping and compliance" },
];

export const SERVICES = [
  {
    id: 1,
    title: "Smart Receipt Scanner",
    description:
      "Transform paper receipts into structured digital data instantly. Our AI reads Indonesian receipts with 95%+ accuracy, extracting items, prices, and merchant details automatically.",
    tag: "AI Vision",
  },
  {
    id: 2,
    title: "Waste Analytics Dashboard",
    description:
      "Track inventory turnover and identify slow-moving items before they expire. Get actionable insights to reduce food waste and improve profit margins.",
    tag: "Intelligence",
  },
  {
    id: 3,
    title: "Stock Recommender",
    description:
      "AI-driven purchasing suggestions based on your sales history and seasonal patterns. Never overstock or run out of popular items again.",
    tag: "Automation",
  },
];

export const IMPACT_STATS = [
  { value: "12,000+", label: "Active Merchants", icon: <Users size={20} /> },
  { value: "40%", label: "Waste Reduction", icon: <TrendingUp size={20} /> },
  { value: "3.2M", label: "Receipts Scanned", icon: <Zap size={20} /> },
];

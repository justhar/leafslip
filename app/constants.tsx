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
    text: "Kurangi overstocking hingga 40% untuk UMKM Indonesia lewat pemantauan stok cerdas",
  },
  {
    id: 2,
    text: "Ubah struk kertas menjadi data bisnis yang bisa ditindaklanjuti",
  },
  { id: 3, text: "Beri UMKM akses analitik setara bisnis besar" },
  { id: 4, text: "Bantu arus barang lebih sehat dan efisien" },
];

export const BENEFITS = [
  { id: 1, text: "Pantau stok dan notifikasi kritis secara real-time" },
  { id: 2, text: "Prediksi risiko menumpuk atau kehabisan barang" },
  { id: 3, text: "Rekomendasi restok otomatis berbasis penjualan" },
  { id: 4, text: "Analisis pola penjualan dan proyeksi permintaan" },
  { id: 5, text: "Sinkronisasi stok lintas lokasi" },
  { id: 6, text: "Pencatatan digital rapi, siap audit" },
];

export const SERVICES = [
  {
    id: 1,
    title: "Pemindai Struk Cerdas",
    description:
      "Ubah struk kertas jadi data digital terstruktur dalam hitungan detik. AI kami membaca struk Indonesia dan mengekstrak item, harga, dan detail toko secara otomatis.",
    tag: "Visi AI",
  },
  {
    id: 2,
    title: "Dashboard Anti-Overstock",
    description:
      "Pantau perputaran stok dan temukan produk yang bergerak lambat sebelum menumpuk. Dapatkan insight untuk menekan biaya dan menjaga margin.",
    tag: "Wawasan",
  },
  {
    id: 3,
    title: "Rekomendasi Stok",
    description:
      "Saran belanja berbasis riwayat penjualan dan pola musiman. Hindari stok berlebih dan kehabisan produk terlaris.",
    tag: "Otomasi",
  },
];

export const IMPACT_STATS = [
  { value: "Scan", label: "Struk Otomatis", icon: <Users size={20} /> },
  { value: "AI", label: "Rekomendasi Stok", icon: <TrendingUp size={20} /> },
  { value: "Rapi", label: "Catatan Digital", icon: <Zap size={20} /> },
];

import SurplusDashboard from "@/app/components/SurplusDashboard";

export const metadata = {
  title: "Surplus Market - GreenSlip",
  description: "Kelola stok surplus dan promosikan diskon",
};

export default function SurplusPage() {
  return (
    <div className="p-4 md:p-8 lg:p-12">
      <SurplusDashboard />
    </div>
  );
}

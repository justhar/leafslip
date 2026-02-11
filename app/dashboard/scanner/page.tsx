"use client";

import ReceiptScanner from "@/app/components/ReceiptScanner";

export default function ScannerPage() {
  return (
    <div className="w-full h-full p-20">
      <ReceiptScanner onReceiptProcessed={(receipt) => console.log(receipt)} />
    </div>
  );
}

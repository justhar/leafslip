"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

const errorMessages: Record<string, string> = {
  Configuration: "Terjadi kesalahan konfigurasi server.",
  AccessDenied: "Anda tidak memiliki akses.",
  Verification: "Token verifikasi telah kedaluwarsa atau sudah digunakan.",
  Default: "Terjadi kesalahan. Silakan coba lagi.",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = errorMessages[error as string] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Error Icon */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">
              Autentikasi Gagal
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
              {error || "ERROR"}
            </p>
          </div>

          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 text-center">{errorMessage}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/signin"
              className="block w-full bg-[#2D3E2D] hover:bg-green-800 text-white font-bold py-3 px-4 rounded-lg transition-all text-center text-sm uppercase tracking-wider"
            >
              Coba Lagi
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg transition-all text-center text-sm uppercase tracking-wider"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}

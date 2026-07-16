"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  X,
  Scan,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Product } from "@/app/types";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductInsights,
} from "@/app/actions/products";
import { getPurchaseSummary } from "@/app/actions/receipts";

type ProductRow = Product & {
  purchasedQuantity?: number;
  needsReview?: boolean;
  insight?: {
    action: string;
    stockRange: string;
    message: string;
  };
};

const formatCurrency = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProductNotice, setNewProductNotice] = useState<string[] | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sellingPrice: "",
    stock: "",
    productionCost: "",
  });

  const normalizeName = (value: string) => value.trim();

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productData, purchaseSummary, insightData] = await Promise.all([
        getProducts(),
        getPurchaseSummary(),
        getProductInsights(),
      ]);

      const purchaseMap = new Map<string, number>(
        purchaseSummary.map((row) => [normalizeName(row.name), row.quantity]),
      );

      const insightMap = new Map(
        insightData.map((row) => [row.productId, row]),
      );

      const enrichedProducts = productData.map((product) => ({
        ...product,
        purchasedQuantity: purchaseMap.get(normalizeName(product.name)) ?? 0,
        needsReview: product.productionCost === 0 || product.stock === 0,
        insight: insightMap.get(product.id),
      }));

      setProducts(enrichedProducts);
    } catch (loadError) {
      setError("Gagal memuat produk.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const storedNotice = localStorage.getItem("greenslip:newProducts");
    if (!storedNotice) return;
    try {
      const parsed = JSON.parse(storedNotice) as { names: string[] };
      if (parsed?.names?.length) {
        setNewProductNotice(parsed.names);
      }
    } catch (parseError) {
      // ignore malformed data
    } finally {
      localStorage.removeItem("greenslip:newProducts");
    }
  }, []);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sellingPrice: product.sellingPrice.toString(),
        stock: product.stock.toString(),
        productionCost: product.productionCost.toString(),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        sellingPrice: "",
        stock: "",
        productionCost: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      sellingPrice: "",
      stock: "",
      productionCost: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const parseNumber = (value: string, fallback = 0) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const sellingPriceValue = parseNumber(formData.sellingPrice, 0);
    const stockValue =
      formData.stock.trim() === "" ? 0 : parseNumber(formData.stock, 0);
    const productionCostValue =
      formData.productionCost.trim() === ""
        ? 0
        : parseNumber(formData.productionCost, 0);

    try {
      if (editingProduct) {
        await updateProduct(Number(editingProduct.id), {
          name: formData.name,
          sellingPrice: sellingPriceValue,
          stock: stockValue,
          productionCost: productionCostValue,
        });
      } else {
        await createProduct({
          name: formData.name,
          sellingPrice: sellingPriceValue,
          stock: stockValue,
          productionCost: productionCostValue,
        });
      }

      handleCloseDialog();
      await loadProducts();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    setDeletingId(id);
    try {
      await deleteProduct(Number(id));
      await loadProducts();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
          Manajemen Produk
        </h3>
        <button
          onClick={() => handleOpenDialog()}
          disabled={isSubmitting}
          className="bg-[#2D3E2D] text-[#D9ED92] px-4 py-2 rounded flex items-center gap-2 hover:brightness-125 transition-all text-xs font-bold uppercase tracking-widest"
        >
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      {newProductNotice && newProductNotice.length > 0 && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Info className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] leading-relaxed text-green-700">
              Produk baru ditambahkan: {newProductNotice.join(", ")}
            </p>
          </div>
          <button
            onClick={() => setNewProductNotice(null)}
            className="text-green-600 hover:text-green-800 text-[10px] font-bold uppercase"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Info Banner - Only show when products exist */}
      {products.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-[10px] leading-relaxed text-blue-700">
            Produk otomatis ditambahkan dari hasil scan struk belanja. Anda
            tetap bisa edit atau hapus produk secara manual.
          </p>
        </div>
      )}

      {error ? (
        <div className="bg-white rounded-md border border-gray-300 py-12 text-center text-[10px] text-red-500 font-bold uppercase tracking-widest">
          {error}
        </div>
      ) : loading ? (
        <div className="bg-white rounded-md border border-gray-300 py-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Memuat produk...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-300 py-16 flex flex-col items-center justify-center text-center space-y-5">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
            <Scan className="text-green-600" size={32} />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
              Produk akan muncul otomatis
            </p>
            <p className="text-[10px] text-gray-400 max-w-sm leading-relaxed">
              Mulai scan struk belanja untuk melihat daftar produk. Sistem akan
              otomatis mendeteksi dan menambahkan produk dari setiap struk yang
              Anda scan.
            </p>
          </div>
          <a
            href="/dashboard/scanner"
            className="bg-[#2D3E2D] text-[#D9ED92] px-5 py-2.5 rounded flex items-center gap-2 hover:brightness-125 transition-all text-xs font-bold uppercase tracking-widest mt-2"
          >
            <Scan size={16} />
            Scan Struk Pertama
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Nama Produk
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Stok
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Dibeli
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Harga Jual
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Biaya Produksi
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Insight AI
                  </th>
                  <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center text-green-600 border border-green-100 flex-shrink-0">
                          <Package size={14} />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-[#2D3E2D]">
                            {product.name}
                          </span>
                          {product.needsReview ? (
                            <span className="ml-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest bg-yellow-50 text-yellow-700 border border-yellow-200">
                              <AlertTriangle size={10} />
                              Data Belum Lengkap
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {product.stock} unit
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {product.purchasedQuantity ?? 0} unit
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        Rp{formatCurrency(product.sellingPrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        Rp{formatCurrency(product.productionCost)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.insight ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                            {product.insight.stockRange} unit
                          </span>
                          <p className="text-[10px] text-gray-600 leading-relaxed">
                            {product.insight.message}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          Insight belum tersedia
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenDialog(product)}
                          disabled={isSubmitting || deletingId === product.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id || isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded border border-red-200 text-red-600 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={12} />
                          {deletingId === product.id ? "Menghapus" : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Transition show={isDialogOpen} as={Fragment}>
        <Dialog onClose={handleCloseDialog} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>

          {/* Full-screen container */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            {/* Dialog panel */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-white rounded-md border border-gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-sm font-black uppercase tracking-[0.2em] text-[#2D3E2D]">
                    {editingProduct ? "Edit Produk" : "Tambah Produk"}
                  </Dialog.Title>
                  <button
                    onClick={handleCloseDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs focus:outline-none focus:border-[#2D3E2D] focus:ring-1 focus:ring-[#2D3E2D] transition-all"
                      placeholder="Contoh: Tomat Segar"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        Harga Jual
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.sellingPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sellingPrice: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs focus:outline-none focus:border-[#2D3E2D] focus:ring-1 focus:ring-[#2D3E2D] transition-all"
                        placeholder="8000"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        Jumlah Stok
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs focus:outline-none focus:border-[#2D3E2D] focus:ring-1 focus:ring-[#2D3E2D] transition-all"
                        placeholder="Kosongkan jika belum diisi"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                      Biaya Produksi
                    </label>
                    <input
                      type="number"
                      value={formData.productionCost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          productionCost: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs focus:outline-none focus:border-[#2D3E2D] focus:ring-1 focus:ring-[#2D3E2D] transition-all"
                      placeholder="Kosongkan jika belum diisi"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseDialog}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded text-gray-600 font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-[#2D3E2D] text-[#D9ED92] rounded font-bold text-xs uppercase tracking-widest hover:brightness-125 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? "Menyimpan"
                        : editingProduct
                          ? "Simpan"
                          : "Tambah"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

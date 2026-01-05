"use client";

import { useState } from "react";
import ImageInput from "@/components/admin/ImageInput";
import type { AdminProduct, AdminSettings } from "@/lib/admin/data";

const sectionClasses =
  "rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl";
const inputClasses =
  "mt-2 w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white focus:outline-none";
const labelClasses =
  "text-xs font-semibold uppercase tracking-wide text-white/70";

const parseColors = (value: string) =>
  value
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);

type ProductFormState = {
  id?: string;
  name: string;
  price: string;
  newPrice: string;
  primaryImage: string;
  secondaryImage: string;
  badge: string;
  colors: string;
};

type AdminDashboardClientProps = {
  initialProducts: AdminProduct[];
  initialSettings: AdminSettings;
};

const toFormState = (product: AdminProduct): ProductFormState => ({
  id: product.id,
  name: product.name,
  price: product.price.toFixed(2),
  newPrice: product.newPrice ? product.newPrice.toFixed(2) : "",
  primaryImage: product.primaryImage,
  secondaryImage: product.secondaryImage,
  badge: product.badge ?? "",
  colors: product.colors.join(", "),
});

const emptyProduct = (): ProductFormState => ({
  name: "",
  price: "",
  newPrice: "",
  primaryImage: "",
  secondaryImage: "",
  badge: "",
  colors: "",
});

export default function AdminDashboardClient({
  initialProducts,
  initialSettings,
}: AdminDashboardClientProps) {
  const [products, setProducts] = useState<ProductFormState[]>(() =>
    initialProducts.map(toFormState),
  );
  const [draft, setDraft] = useState<ProductFormState>(() => emptyProduct());
  const [settings, setSettings] = useState({
    shippingFee: initialSettings.shippingFee.toString(),
    shippingFreeThreshold: initialSettings.shippingFreeThreshold.toString(),
    supportEmail: initialSettings.supportEmail,
    supportPhone: initialSettings.supportPhone,
  });
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const showStatus = (type: "success" | "error", message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 4000);
  };

  const buildPayload = (product: ProductFormState) => {
    const priceValue = Number(product.price);
    let newPriceValue: number | null = null;
    if (product.newPrice.trim()) {
      const parsedDiscount = Number(product.newPrice);
      if (!Number.isFinite(parsedDiscount) || parsedDiscount <= 0) {
        throw new Error("Discount price must be a positive number.");
      }
      newPriceValue = parsedDiscount;
    }

    if (!product.name.trim()) {
      throw new Error("Product name is required.");
    }
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      throw new Error("Price must be a positive number.");
    }
    if (!product.primaryImage.trim() || !product.secondaryImage.trim()) {
      throw new Error("Both product images are required.");
    }

    return {
      name: product.name.trim(),
      price: priceValue,
      newPrice: newPriceValue,
      primaryImage: product.primaryImage.trim(),
      secondaryImage: product.secondaryImage.trim(),
      badge: product.badge.trim() || null,
      colors: parseColors(product.colors),
    };
  };

  const handleSettingsSave = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingFee: settings.shippingFee,
          shippingFreeThreshold: settings.shippingFreeThreshold,
          supportEmail: settings.supportEmail,
          supportPhone: settings.supportPhone,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        success: boolean;
        error?: string;
        settings?: AdminSettings;
      } | null;

      if (!response.ok || !result?.success || !result.settings) {
        throw new Error(result?.error ?? "Unable to save settings.");
      }

      setSettings({
        shippingFee: result.settings.shippingFee.toString(),
        shippingFreeThreshold: result.settings.shippingFreeThreshold.toString(),
        supportEmail: result.settings.supportEmail,
        supportPhone: result.settings.supportPhone,
      });
      showStatus("success", "Settings updated.");
    } catch (error) {
      console.error("Failed to save settings", error);
      showStatus("error", "Unable to save settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!passwordForm.current) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (!passwordVerified) {
      setPasswordError("Verify your current password first.");
      return;
    }
    if (!passwordForm.next || !passwordForm.confirm) {
      setPasswordError("Fill in the new password fields.");
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordForm.next === passwordForm.current) {
      setPasswordError("New password must be different.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { success: boolean; error?: string }
        | null;

      if (!response.ok || !result?.success) {
        const message = result?.error ?? "Unable to update password.";
        setPasswordError(message);
        if (message.toLowerCase().includes("current password")) {
          setPasswordVerified(false);
        }
        return;
      }

      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordVerified(false);
      showStatus("success", "Password updated.");
    } catch (error) {
      console.error("Failed to update password", error);
      setPasswordError(
        error instanceof Error ? error.message : "Unable to update password.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!passwordForm.current) {
      setPasswordError("Enter your current password.");
      return;
    }
    setPasswordError(null);
    setIsVerifyingPassword(true);
    try {
      const response = await fetch("/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.current }),
      });
      const result = (await response.json().catch(() => null)) as
        | { success: boolean; error?: string }
        | null;

      if (!response.ok || !result?.success) {
        setPasswordVerified(false);
        setPasswordError(
          result?.error ?? "Current password is incorrect.",
        );
        return;
      }

      setPasswordVerified(true);
      showStatus("success", "Current password verified.");
    } catch (error) {
      console.error("Failed to verify password", error);
      setPasswordError("Unable to verify password.");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleCreateProduct = async () => {
    setIsCreating(true);
    try {
      const payload = buildPayload(draft);
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        success: boolean;
        error?: string;
        product?: AdminProduct | null;
      } | null;

      if (!response.ok || !result || !result.success || !result.product) {
        throw new Error(result?.error ?? "Unable to create product.");
      }

      const createdProduct = result.product;
      setProducts((prev) => [toFormState(createdProduct), ...prev]);
      setDraft(emptyProduct());
      showStatus("success", "Product created.");
    } catch (error) {
      console.error("Failed to create product", error);
      showStatus(
        "error",
        error instanceof Error ? error.message : "Unable to create product.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProduct = async (product: ProductFormState) => {
    if (!product.id) return;
    setBusyProductId(product.id);
    try {
      const payload = buildPayload(product);
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        success: boolean;
        error?: string;
        product?: AdminProduct;
      } | null;

      if (!response.ok || !result || !result.success || !result.product) {
        throw new Error(result?.error ?? "Unable to update product.");
      }

      const updatedProduct = result.product;
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? toFormState(updatedProduct)
            : item,
        ),
      );
      showStatus("success", "Product updated.");
    } catch (error) {
      console.error("Failed to update product", error);
      showStatus(
        "error",
        error instanceof Error ? error.message : "Unable to update product.",
      );
    } finally {
      setBusyProductId(null);
    }
  };

  const handleDeleteProduct = async (productId?: string) => {
    if (!productId) return;
    setBusyProductId(productId);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as {
        success: boolean;
        error?: string;
      } | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? "Unable to delete product.");
      }

      setProducts((prev) => prev.filter((item) => item.id !== productId));
      showStatus("success", "Product deleted.");
    } catch (error) {
      console.error("Failed to delete product", error);
      showStatus(
        "error",
        error instanceof Error ? error.message : "Unable to delete product.",
      );
    } finally {
      setBusyProductId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Undercontrol Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-sm text-white/60">
              Manage products, discounts, shipping, and support info.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/50 hover:text-white"
          >
            Sign out
          </button>
        </header>

        {status ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-400/40 text-emerald-200"
                : "border-rose-400/40 text-rose-200"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <section className={sectionClasses}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                Store Settings
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Shipping & Contact
              </h2>
            </div>
            <button
              type="button"
              onClick={handleSettingsSave}
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-wide text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSavingSettings}
            >
              {isSavingSettings ? "Saving..." : "Save settings"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Shipping fee (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.shippingFee}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    shippingFee: event.target.value,
                  }))
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>
                Free shipping threshold (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.shippingFreeThreshold}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    shippingFreeThreshold: event.target.value,
                  }))
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Support email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    supportEmail: event.target.value,
                  }))
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Support phone</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    supportPhone: event.target.value,
                  }))
                }
                className={inputClasses}
              />
            </div>
          </div>
        </section>

        <section className={sectionClasses}>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            New Product
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Add product</h2>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-4">
              <div>
                <label className={labelClasses}>Product name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className={inputClasses}
                  placeholder="Product name"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClasses}>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={draft.price}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        price: event.target.value,
                      }))
                    }
                    className={inputClasses}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    Discount price (optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={draft.newPrice}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        newPrice: event.target.value,
                      }))
                    }
                    className={inputClasses}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Badge (optional)</label>
                <input
                  type="text"
                  value={draft.badge}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, badge: event.target.value }))
                  }
                  className={inputClasses}
                  placeholder="new"
                />
              </div>
              <div>
                <label className={labelClasses}>Colors (comma separated)</label>
                <input
                  type="text"
                  value={draft.colors}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      colors: event.target.value,
                    }))
                  }
                  className={inputClasses}
                  placeholder="black, gray, #ffffff"
                />
              </div>
            </div>

            <div className="space-y-4">
              <ImageInput
                label="Primary image"
                value={draft.primaryImage}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, primaryImage: value }))
                }
              />
              <ImageInput
                label="Secondary image"
                value={draft.secondaryImage}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, secondaryImage: value }))
                }
              />
              <button
                type="button"
                onClick={handleCreateProduct}
                className="w-full rounded-full bg-white py-3 text-base font-semibold uppercase tracking-wide text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Add product"}
              </button>
            </div>
          </div>
        </section>

        <section className={sectionClasses}>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            Products
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Manage catalog</h2>

          {products.length === 0 ? (
            <p className="mt-6 text-sm text-white/60">
              No products yet. Add your first product above.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {products.map((product, index) => (
                <div
                  key={product.id ?? index}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/60">Product ID</p>
                      <p className="text-xs text-white/80">{product.id}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdateProduct(product)}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/50 hover:text-white disabled:opacity-60"
                        disabled={busyProductId === product.id}
                      >
                        {busyProductId === product.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="rounded-full border border-rose-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-300 hover:text-rose-100 disabled:opacity-60"
                        disabled={busyProductId === product.id}
                      >
                        {busyProductId === product.id ? "Working..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                    <div className="space-y-4">
                      <div>
                        <label className={labelClasses}>Product name</label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(event) => {
                            const value = event.target.value;
                            setProducts((prev) =>
                              prev.map((item) =>
                                item.id === product.id
                                  ? { ...item, name: value }
                                  : item,
                              ),
                            );
                          }}
                          className={inputClasses}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClasses}>Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.price}
                            onChange={(event) => {
                              const value = event.target.value;
                              setProducts((prev) =>
                                prev.map((item) =>
                                  item.id === product.id
                                    ? { ...item, price: value }
                                    : item,
                                ),
                              );
                            }}
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label className={labelClasses}>Discount price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.newPrice}
                            onChange={(event) => {
                              const value = event.target.value;
                              setProducts((prev) =>
                                prev.map((item) =>
                                  item.id === product.id
                                    ? { ...item, newPrice: value }
                                    : item,
                                ),
                              );
                            }}
                            className={inputClasses}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>Badge</label>
                        <input
                          type="text"
                          value={product.badge}
                          onChange={(event) => {
                            const value = event.target.value;
                            setProducts((prev) =>
                              prev.map((item) =>
                                item.id === product.id
                                  ? { ...item, badge: value }
                                  : item,
                              ),
                            );
                          }}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Colors</label>
                        <input
                          type="text"
                          value={product.colors}
                          onChange={(event) => {
                            const value = event.target.value;
                            setProducts((prev) =>
                              prev.map((item) =>
                                item.id === product.id
                                  ? { ...item, colors: value }
                                  : item,
                              ),
                            );
                          }}
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <ImageInput
                        label="Primary image"
                        value={product.primaryImage}
                        onChange={(value) => {
                          setProducts((prev) =>
                            prev.map((item) =>
                              item.id === product.id
                                ? { ...item, primaryImage: value }
                                : item,
                            ),
                          );
                        }}
                      />
                      <ImageInput
                        label="Secondary image"
                        value={product.secondaryImage}
                        onChange={(value) => {
                          setProducts((prev) =>
                            prev.map((item) =>
                              item.id === product.id
                                ? { ...item, secondaryImage: value }
                                : item,
                            ),
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={sectionClasses}>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            Security
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Change password</h2>
          <p className="mt-2 text-sm text-white/60">
            Verify your current password before setting a new one.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label className={labelClasses}>Current password</label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={(event) => {
                  const value = event.target.value;
                  setPasswordForm({ current: value, next: "", confirm: "" });
                  setPasswordVerified(false);
                  setPasswordError(null);
                }}
                className={inputClasses}
                placeholder="current password"
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleVerifyPassword}
                className="w-full rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/50 hover:text-white disabled:opacity-60"
                disabled={isVerifyingPassword || passwordVerified}
              >
                {passwordVerified
                  ? "Verified"
                  : isVerifyingPassword
                    ? "Verifying..."
                    : "Verify current"}
              </button>
            </div>
          </div>

          {!passwordVerified ? (
            <p className="mt-4 text-sm text-white/60">
              Verify your current password to unlock the new password fields.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClasses}>New password</label>
                <input
                  type="password"
                  value={passwordForm.next}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      next: event.target.value,
                    }))
                  }
                  className={inputClasses}
                  placeholder="new password"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className={labelClasses}>Confirm new password</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirm: event.target.value,
                    }))
                  }
                  className={inputClasses}
                  placeholder="confirm password"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {passwordError ? (
            <p className="mt-4 text-sm text-rose-200">{passwordError}</p>
          ) : null}

          {passwordVerified ? (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleChangePassword}
                className="rounded-full bg-white px-6 py-2 text-xs font-semibold uppercase tracking-wide text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? "Updating..." : "Update password"}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

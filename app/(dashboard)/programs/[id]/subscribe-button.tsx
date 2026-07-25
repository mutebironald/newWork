"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export function SubscribeButton({ orgId, productKey, label }: { orgId?: string; productKey: string; label: string }) {
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, productKey }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        if (data.error) alert(`Stripe Checkout Error: ${data.error}`);
        setLoading(false);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to create checkout session"}`);
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={subscribe} loading={loading}>
      <CreditCard className="h-4 w-4 mr-1.5" />
      {label}
    </Button>
  );
}

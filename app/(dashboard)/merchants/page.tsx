import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge, timeAgo } from "@/lib/utils";
import { Store, CheckCircle2, Star } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const categoryColors: Record<string, string> = {
  pharmacy: "text-blue-700 bg-blue-50 border-blue-200",
  restaurant: "text-orange-700 bg-orange-50 border-orange-200",
  salon: "text-pink-700 bg-pink-50 border-pink-200",
  shop: "text-green-700 bg-green-50 border-green-200",
  retail: "text-indigo-700 bg-indigo-50 border-indigo-200",
  market: "text-yellow-700 bg-yellow-50 border-yellow-200",
  other: "text-gray-700 bg-gray-50 border-gray-200",
};

export default async function MerchantsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const merchantsSnapshot = await db.collection("merchants").get();
  const merchants: any[] = [];
  for (const doc of merchantsSnapshot.docs) {
    const merchant = doc.data();

    // Fetch org
    const orgDoc = await db.collection("organizations").doc(merchant.orgId).get();
    const org = orgDoc.exists ? orgDoc.data() : { name: "Unknown" };

    // Fetch workEpisodes
    const episodesSnapshot = await db
      .collection("work_episodes")
      .where("merchantId", "==", doc.id)
      .get();
    const workEpisodes = episodesSnapshot.docs.map((d: any) => {
      const data = d.data();
      return { status: data.status, amount: data.amount };
    });

    // Fetch confirmations
    const confirmationsSnapshot = await db
      .collection("merchant_confirmations")
      .where("merchantId", "==", doc.id)
      .get();
    const confirmations = confirmationsSnapshot.docs.map((d: any) => {
      const data = d.data();
      return { confirmed: data.confirmed, rating: data.rating };
    });

    merchants.push({
      ...merchant,
      id: doc.id,
      org,
      workEpisodes,
      confirmations,
    });
  }

  // Sort by createdAt desc
  merchants.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
        <p className="text-sm text-gray-500 mt-1">
          {merchants.length} businesses · Merchant pays agent directly — platform is SaaS only
        </p>
      </div>

      {merchants.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Store className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No merchants yet.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {merchants.map((merchant) => {
          const completedEps = merchant.workEpisodes.filter((e: any) =>
            ["verified", "paid", "merchant_confirmed"].includes(e.status)
          ).length;
          const confirmedCount = merchant.confirmations.filter((c: any) => c.confirmed).length;
          const ratings = merchant.confirmations.filter((c: any) => c.rating);
          const avgRating =
            ratings.length > 0
              ? (ratings.reduce((s: number, c: any) => s + (c.rating || 0), 0) / ratings.length).toFixed(1)
              : null;
          const status = getStatusBadge(merchant.status);
          const catColor = categoryColors[merchant.category] || categoryColors.other;

          return (
            <Link key={merchant.id} href={`/merchants/${merchant.id}`}>
              <div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{merchant.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{merchant.phone}</p>
                    <p className="text-xs text-gray-400">
                      {merchant.district || "District unknown"} · {merchant.address || "No address"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge className={catColor}>{merchant.category}</Badge>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">{completedEps}</p>
                    <p className="text-xs text-gray-400">Episodes</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <p className="text-sm font-bold text-gray-900">{confirmedCount}</p>
                    </div>
                    <p className="text-xs text-gray-400">Confirmed</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
                      <p className="text-sm font-bold text-gray-900">{avgRating || "–"}</p>
                    </div>
                    <p className="text-xs text-gray-400">Avg Rating</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-3 text-right">
                  {merchant.org.name} · Added {timeAgo(merchant.createdAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

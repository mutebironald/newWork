import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Sparkles, Building2, UserCheck, ShieldCheck, Zap } from "lucide-react";
import { SubscribeButton } from "../programs/[id]/subscribe-button";

export const dynamic = "force-dynamic";

export default async function PlansDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; product?: string }>;
}) {
  const { payment, product } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "agent") redirect("/overview");

  // Fetch current user organization if any
  let userOrg: any = null;
  let activeTier = "free";

  const userDoc = await db.collection("users").doc(session.id).get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    if (userData?.organizationId) {
      const orgDoc = await db.collection("organizations").doc(userData.organizationId).get();
      if (orgDoc.exists) {
        userOrg = { id: orgDoc.id, ...orgDoc.data() };
        const subSnapshot = await db
          .collection("org_subscriptions")
          .where("orgId", "==", orgDoc.id)
          .where("status", "==", "active")
          .limit(1)
          .get();
        if (!subSnapshot.empty) {
          activeTier = subSnapshot.docs[0].data().tier || "cohort_pack";
        }
      }
    }
  }

  // Fallback to first org if user is admin/operator
  if (!userOrg && ["operator", "org_admin"].includes(session.role)) {
    const orgsSnapshot = await db.collection("organizations").limit(1).get();
    if (!orgsSnapshot.empty) {
      const firstDoc = orgsSnapshot.docs[0];
      userOrg = { id: firstDoc.id, ...firstDoc.data() };
      const subSnapshot = await db
        .collection("org_subscriptions")
        .where("orgId", "==", firstDoc.id)
        .where("status", "==", "active")
        .limit(1)
        .get();
      if (!subSnapshot.empty) {
        activeTier = subSnapshot.docs[0].data().tier || "cohort_pack";
      }
    }
  }

  const orgPlans = [
    {
      key: "free",
      name: "Free Tier",
      price: "$0",
      period: "forever",
      tagline: "Basic access to explore platform features & create organization profiles.",
      icon: Building2,
      features: [
        "1 Organization profile",
        "Browse open opportunities",
        "View public impact reports",
        "Community support",
      ],
      popular: false,
    },
    {
      key: "cohort_pack",
      name: "Cohort Pack",
      price: "$499",
      period: "per month",
      productKey: "cohort_pack" as const,
      tagline: "Essential package for NGOs & workforce programs launching agent cohorts.",
      icon: Sparkles,
      features: [
        "Unlimited participant cohorts",
        "Up to 100 Field Agents enrolled",
        "Real-time income ledger tracking",
        "AI Work Designer & offer generation",
        "XPRIZE evidence metrics export",
        "Standard email & chat support",
      ],
      popular: true,
    },
    {
      key: "partner",
      name: "Partner Plan",
      price: "$999",
      period: "per month",
      productKey: "partner" as const,
      tagline: "Enterprise package for large incubators, government sponsors & multi-region NGOs.",
      icon: ShieldCheck,
      features: [
        "Everything in Cohort Pack",
        "Unlimited Field Agents",
        "Dedicated AI Program Monitor",
        "Automated fraud & anomaly detection",
        "Custom donor impact exports & APIs",
        "Priority 24/7 account management",
      ],
      popular: false,
    },
  ];

  const agentProducts = [
    {
      key: "plus_monthly",
      name: "NewWork Plus",
      price: "$19",
      period: "per month",
      productKey: "plus_monthly",
      buttonLabel: "Subscribe ($19/mo)",
      tagline: "Monthly toolkit for active field agents delivering micro-services.",
      icon: Zap,
      features: [
        "Unlimited receipt & ledger extractions",
        "AI outreach script generator (WhatsApp)",
        "Priority opportunity matching",
        "Verified digital work portfolio",
      ],
    },
    {
      key: "launch_kit",
      name: "Agent Launch Kit",
      price: "$49",
      period: "one-time",
      productKey: "launch_kit",
      buttonLabel: "Purchase ($49)",
      tagline: "Complete physical & digital onboarding pack for new service agents.",
      icon: UserCheck,
      features: [
        "Full AI agent workspace activation",
        "Physical/digital brand collateral templates",
        "7-day merchant outreach playbook",
        "Direct mentor guidance channel",
      ],
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Notifications */}
      {payment === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 flex items-center justify-between">
          <span>
            🎉 Payment successful! Your subscription for {product || "the package"} is now active.
          </span>
        </div>
      )}
      {payment === "cancelled" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
          Checkout was cancelled — no charges were made.
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
          <CreditCard className="h-3.5 w-3.5 mr-1" /> Plans & Pricing
        </Badge>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Flexible Plans for Organizations & Agents
        </h1>
        <p className="text-gray-600 text-base">
          Choose the right package to scale your workforce programs, verify paid work episodes, and empower field agents.
        </p>
      </div>

      {/* Organization Plans Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Organization Packages</h2>
            <p className="text-sm text-gray-500">
              For NGOs, workforce incubators, schools, and partner organizations.
            </p>
          </div>
          {userOrg && (
            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
              Active Org: {userOrg.name} ({activeTier})
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {orgPlans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = activeTier === plan.key;

            return (
              <Card
                key={plan.key}
                className={`flex flex-col relative transition-all ${
                  plan.popular
                    ? "border-2 border-indigo-600 shadow-lg scale-105"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    Most Popular
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    {isCurrent && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                        Current Plan
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <p className="text-xs text-gray-500 min-h-[32px]">{plan.tagline}</p>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-sm font-medium text-gray-500">/{plan.period}</span>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      What's Included
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-gray-100">
                  {plan.key === "free" ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 rounded-lg bg-gray-100 text-gray-400 text-sm font-medium text-center"
                    >
                      Included by default
                    </button>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm font-medium text-center"
                    >
                      Active Plan
                    </button>
                  ) : userOrg ? (
                    <div className="w-full text-center">
                      <SubscribeButton
                        orgId={userOrg.id}
                        productKey={plan.productKey!}
                        label={`Subscribe (${plan.price}/mo)`}
                      />
                    </div>
                  ) : (
                    <a
                      href="/programs/new"
                      className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium text-center transition-colors block"
                    >
                      Register Org to Subscribe
                    </a>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Agent Products Section */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-gray-200 pb-3">
          <h2 className="text-xl font-bold text-gray-900">Field Agent Products</h2>
          <p className="text-sm text-gray-500">
            For individual youth agents delivering AI micro-services to local merchants.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {agentProducts.map((prod) => {
            const Icon = prod.icon;
            return (
              <Card key={prod.key} className="flex flex-col border border-gray-200 hover:border-gray-300 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">{prod.name}</CardTitle>
                      <p className="text-xs text-gray-500">{prod.tagline}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">{prod.price}</span>
                    <span className="text-xs text-gray-500">/{prod.period}</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {prod.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-4 border-t border-gray-100">
                  <div className="w-full text-center">
                    <SubscribeButton
                      productKey={prod.productKey}
                      label={prod.buttonLabel}
                    />
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

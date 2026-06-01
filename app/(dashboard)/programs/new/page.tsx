"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const ORG_TYPES = [
  { value: "ngo", label: "NGO" },
  { value: "school", label: "School" },
  { value: "government", label: "Government" },
  { value: "foundation", label: "Foundation" },
  { value: "accelerator", label: "Accelerator" },
  { value: "other", label: "Other" },
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Brazzaville)", "Congo (Kinshasa)", "Costa Rica", "Croatia", "Cuba",
  "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia",
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
  "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe",
];

export default function NewOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "ngo",
    email: "",
    phone: "",
    address: "",
    country: "United States",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Organization name is required"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create organization"); return; }
      router.push("/programs");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/programs" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add a new organization to the platform</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="name"
              label="Organization Name"
              placeholder="e.g. Youth Employment Initiative"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                id="type"
                label="Organization Type"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                options={ORG_TYPES}
              />
              <Select
                id="country"
                label="Country"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <Input
              id="email"
              label="Email (optional)"
              type="email"
              placeholder="contact@organization.org"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="phone"
                label="Phone (optional)"
                placeholder="+1 234 567 8900"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
              <Input
                id="address"
                label="Address (optional)"
                placeholder="City, Country"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading} className="flex-1">
                Create Organization
              </Button>
              <Link href="/programs">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

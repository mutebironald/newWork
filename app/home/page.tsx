import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/overview");

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#11263C] p-4 md:p-8 overflow-y-auto relative">
      {/* Decorative background blur shapes for visual depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4f46e5] rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7c3aed] rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div className="w-full max-w-xl md:max-w-2xl bg-[#F7F3EA] rounded-[32px] border border-[#e5dfd2] p-8 md:p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10">
        {/* Brand Logo squircle with hover scaling effect */}
        <div className="flex justify-center mb-6">
          <div className="transition-all duration-300 transform hover:scale-105 hover:rotate-3 drop-shadow-md">
            <Logo className="h-16 w-16 md:h-20 md:w-20" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#11263C] tracking-tight mb-2">
          NewWork
        </h1>
        
        {/* Subtitle */}
        <p className="text-md md:text-lg font-medium text-[#53616E] mb-6">
          Turning skills into paid work
        </p>
        
        {/* Line separator */}
        <div className="w-24 h-[2px] bg-[#C7BDAF] mx-auto mb-6" />
        
        {/* Core Tagline Description */}
        <p className="text-lg md:text-xl font-semibold text-[#496B5B] max-w-lg mx-auto mb-8 leading-relaxed">
          A work creation engine for youth agents and informal merchants
        </p>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-md md:max-w-lg mx-auto">
          {[
            "Skill intake",
            "Service offers",
            "Merchant support",
            "Paid work episodes",
            "Proof-of-work",
          ].map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#efe9dc] text-[#11263C] border border-[#d3c9ba] shadow-sm hover:bg-[#eae2d3] transition-colors duration-200 cursor-default"
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Interactive Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-[#11263C] text-white rounded-xl font-bold text-sm hover:bg-[#1a3857] hover:shadow-lg active:scale-[0.98] transition-all duration-200 text-center"
          >
            Create an Account
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-transparent border-2 border-[#C7BDAF] text-[#11263C] rounded-xl font-bold text-sm hover:border-[#11263C] hover:bg-white/30 active:scale-[0.98] transition-all duration-200 text-center"
          >
            Already registered? Login
          </Link>
        </div>
      </div>
    </div>
  );
}

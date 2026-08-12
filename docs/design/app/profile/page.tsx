import { USER } from "@/lib/data";
import { LanguageToggle } from "@/components/ui";

export default function ProfilePage() {
  const rows = [
    ["Email", USER.email],
    ["Level", USER.level],
    ["Age", String(USER.age)],
    ["Club", USER.club],
  ];

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div className="flex items-center gap-4 lg:gap-[18px]">
          <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-ink text-xl font-bold text-paper lg:h-[76px] lg:w-[76px] lg:text-2xl">
            {USER.initials}
          </div>
          <div>
            <h1 className="text-[21px] font-bold tracking-[-0.02em] text-ink lg:text-[28px]">
              {USER.name}
            </h1>
            <div className="mt-0.5 text-[13px] text-muted lg:text-sm">
              {USER.club} · Member since {USER.memberSince}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-white px-5 py-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between border-b border-[#E9EDE9] py-3.5 last:border-0"
            >
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm text-ink">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-[#E9EDE9] py-3.5">
            <span className="text-sm text-muted">Language</span>
            <LanguageToggle />
          </div>
        </div>

        <button
          type="button"
          className="rounded-full border border-line py-3.5 text-[15px] font-semibold text-danger"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

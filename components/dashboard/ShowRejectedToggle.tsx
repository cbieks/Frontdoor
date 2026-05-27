"use client";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  count: number;
  active: boolean;
};

export function ShowRejectedToggle({ count, active }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (active) {
      params.delete("showRejected");
    } else {
      params.set("showRejected", "1");
    }
    const qs = params.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={active}
        onChange={toggle}
        className="h-4 w-4 rounded border-neutral-300"
      />
      Show rejected ({count})
    </label>
  );
}

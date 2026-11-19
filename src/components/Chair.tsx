import { fmtRemain, statusLabel, useSeats, type Chair } from "../lib/seats";

export const lampColor = { green: "#35d07f", red: "#f2564d", yellow: "#ffb81c" } as const;

export function Lamp({ status, size = 28 }: { status: Chair["status"]; size?: number }) {
  const c = lampColor[status];
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: c, boxShadow: `0 0 ${size * 0.8}px ${c}66, inset 0 -${size / 6}px ${size / 4}px #0004` }}
    />
  );
}

export function ChairTile({ chair, onTap, compact }: { chair: Chair; onTap?: () => void; compact?: boolean }) {
  const { remainingMs } = useSeats();
  const rem = remainingMs(chair);
  const body = (
    <>
      <Lamp status={chair.status} size={compact ? 20 : 30} />
      <span className="mt-2 block text-sm font-bold text-[#f1efe8]">{chair.id}번 의자</span>
      <span className="block text-xs text-[#9aa09b]">테이블 {chair.table_number}</span>
      <span className={`mt-1 block text-xs font-semibold tabular-nums ${chair.status === "yellow" ? "text-[#ffb81c]" : "text-[#9aa09b]"}`}>
        {rem !== null ? `${fmtRemain(rem)} 남음` : statusLabel[chair.status]}
      </span>
    </>
  );
  const cls = "block w-full rounded-xl border border-[#2c3236] bg-[#1d2124] p-3 text-left";
  return onTap ? (
    <button type="button" onClick={onTap} aria-label={`${chair.id}번 의자, ${statusLabel[chair.status]}. 눌러서 센서 감지 흉내`} className={`${cls} transition active:scale-95 hover:border-[#4a5258] min-h-24`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function SeatMap({ onTap, compact }: { onTap?: (id: number) => void; compact?: boolean }) {
  const { chairs } = useSeats();
  const tables = [...new Set(chairs.map((c) => c.table_number))];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tables.map((t) => (
        <section key={t} aria-label={`테이블 ${t}`} className="rounded-2xl bg-[#14171a] p-3 ring-1 ring-[#2c3236]">
          <h3 className="mb-2 px-1 text-sm font-bold text-[#9aa09b]">테이블 {t}</h3>
          <div className="grid grid-cols-2 gap-2">
            {chairs.filter((c) => c.table_number === t).map((c) => (
              <ChairTile key={c.id} chair={c} compact={compact} onTap={onTap ? () => onTap(c.id) : undefined} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

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

export function SeatCountControl() {
  const { chairs, addChair, removeChair } = useSeats();
  const btn = "grid size-11 place-items-center rounded-xl bg-[#2a3034] text-2xl font-black hover:bg-[#343b40] active:scale-95";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#1d2124] p-4 ring-1 ring-[#2c3236]">
      <div>
        <div className="font-bold">의자 수</div>
        <div className="text-xs text-[#9aa09b]">+를 누르면 의자가 한 개 늘고, −를 누르면 마지막 번호의 빈 의자가 한 개 줄어요. 테이블은 4석씩 묶여요.</div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button type="button" onClick={removeChair} aria-label="의자 한 개 줄이기" className={btn}>−</button>
        <span className="min-w-14 text-center text-3xl font-black tabular-nums">{chairs.length}</span>
        <button type="button" onClick={addChair} aria-label="의자 한 개 늘리기" className={btn}>+</button>
      </div>
    </div>
  );
}

export function AwayTimeControl() {
  const { minutes, setMinutes, demo } = useSeats();
  const btn = "grid size-11 place-items-center rounded-xl bg-[#2a3034] text-2xl font-black hover:bg-[#343b40] active:scale-95";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#1d2124] p-4 ring-1 ring-[#2c3236]">
      <div>
        <div className="font-bold">자리 비움 제한 시간</div>
        <div className="text-xs text-[#9aa09b]">
          손님이 일어난 순간부터 이 시간이 지나면 빈자리가 돼요.
          {demo && " 지금은 시연 모드라 10초로 돌아가요. 시연 모드를 끄면 아래 시간이 적용돼요."}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button type="button" onClick={() => setMinutes(minutes - 1)} aria-label="1분 줄이기" className={btn}>−</button>
        <span className="min-w-20 text-center text-3xl font-black tabular-nums">{minutes}<span className="ml-1 text-base font-bold">분</span></span>
        <button type="button" onClick={() => setMinutes(minutes + 1)} aria-label="1분 늘리기" className={btn}>+</button>
      </div>
      <div className="flex w-full gap-2">
        {[5, 10, 20, 30, 60].map((m) => (
          <button key={m} type="button" onClick={() => setMinutes(m)} className={`h-10 flex-1 rounded-lg text-sm font-bold ${minutes === m ? "bg-[#f1efe8] text-[#14171a]" : "bg-[#2a3034] hover:bg-[#343b40]"}`}>{m}분</button>
        ))}
      </div>
    </div>
  );
}

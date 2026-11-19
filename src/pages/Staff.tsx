import { Lamp, AwayTimeControl, SeatCountControl } from "../components/Chair";
import { fmtRemain, fmtTime, statusLabel, useSeats } from "../lib/seats";

export default function Staff() {
  const { chairs, logs, events, remainingMs, handleLog } = useSeats();
  const away = chairs.filter((c) => c.status === "yellow");
  const pending = logs.filter((l) => !l.handled_at);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight">직원 화면</h1>
      <AwayTimeControl />
      <SeatCountControl />

      <section className="rounded-2xl bg-[#1d2124] p-4 ring-1 ring-[#2c3236]">
        <h2 className="mb-2 font-bold">소지품 보관이 필요한 의자 <span className="text-[#ffb81c]">{pending.length}</span></h2>
        {pending.length === 0 ? (
          <p className="text-sm text-[#9aa09b]">처리할 의자가 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#2a2314] p-3">
                <Lamp status="yellow" size={16} />
                <span className="font-semibold">{l.message}</span>
                <span className="text-xs tabular-nums text-[#9aa09b]">{fmtTime(l.created_at)}</span>
                <button type="button" onClick={() => handleLog(l.id)} className="ml-auto rounded-lg bg-[#f1efe8] px-4 py-2 text-sm font-bold text-[#14171a]">처리 완료</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-[#1d2124] p-4 ring-1 ring-[#2c3236]">
        <h2 className="mb-2 font-bold">자리 비움 중인 의자 {away.length}</h2>
        {away.length === 0 ? (
          <p className="text-sm text-[#9aa09b]">지금 자리를 비운 의자는 없어요.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {away.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl bg-[#14171a] p-3">
                <Lamp status="yellow" size={16} />
                <span className="font-semibold">{c.id}번 의자 · 테이블 {c.table_number}</span>
                <span className="ml-auto font-bold tabular-nums text-[#ffb81c]">{fmtRemain(remainingMs(c) ?? 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-[#1d2124] p-4 ring-1 ring-[#2c3236]">
        <h2 className="mb-2 font-bold">상태 이력</h2>
        {events.length === 0 ? (
          <p className="text-sm text-[#9aa09b]">아직 이력이 없어요.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-3">
                <span className="tabular-nums text-[#9aa09b]">{fmtTime(e.created_at)}</span>
                <span>{e.chair_id}번 의자 {e.reason}</span>
                <span className="text-[#9aa09b]">{statusLabel[e.from_status]} → {statusLabel[e.to_status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

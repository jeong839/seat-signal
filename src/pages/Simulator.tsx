import { SeatMap } from "../components/Chair";
import { fmtTime, useSeats } from "../lib/seats";

export default function Simulator() {
  const { tap, logs, free, chairs, resetDemo } = useSeats();
  const used = chairs.filter((c) => c.status === "red").length;
  const away = chairs.filter((c) => c.status === "yellow").length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">의자 시뮬레이터</h1>
        <p className="mt-1 text-sm text-[#9aa09b]">의자를 누르면 센서 감지를 흉내 내요. 빈 의자는 착석, 사용 중은 이석, 자리 비움은 복귀예요.</p>
        <p className="mt-3 text-sm font-semibold tabular-nums">빈자리 {free} · 사용 중 {used} · 자리 비움 {away}</p>
      </div>
      <SeatMap onTap={tap} />
      <section aria-label="직원 알림 로그" className="rounded-2xl bg-[#1d2124] p-4 ring-1 ring-[#2c3236]">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">직원 알림 로그</h2>
          <button type="button" onClick={resetDemo} className="rounded-lg bg-[#2a3034] px-3 py-2 text-sm font-semibold hover:bg-[#343b40]">시연 처음부터</button>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-[#9aa09b]">아직 알림이 없어요. 의자를 노란불로 두고 시간이 지나면 여기에 나타나요.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex gap-3"><span className="tabular-nums text-[#9aa09b]">{fmtTime(l.created_at)}</span><span>{l.message}</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

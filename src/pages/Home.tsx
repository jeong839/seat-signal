import { useState } from "react";
import { Lamp, SeatMap } from "../components/Chair";
import { useSeats } from "../lib/seats";

export default function Home() {
  const { free, chairs, limitMs, demo, minutes } = useSeats();
  const [party, setParty] = useState(2);
  const ok = party <= free;
  const mins = `${minutes}분`;
  return (
    <div className="space-y-6">
      <div role="note" className="rounded-xl bg-[#ffb81c] px-4 py-3 text-sm font-bold leading-relaxed text-[#1c1500]">
        {mins} 이상 자리를 비우면 좌석이 자동으로 해제되고, 남겨 둔 소지품은 직원이 보관 바구니로 옮길 수 있어요.
      </div>

      <section className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl bg-[#1d2124] p-5 ring-1 ring-[#2c3236]">
          <h1 className="text-2xl font-black tracking-tight">몇 분이세요?</h1>
          <p className="mt-1 text-sm text-[#9aa09b]">+와 −로 인원을 맞추면 앉을 수 있는지 바로 알려 드려요.</p>
          <div className="mt-5 flex items-center justify-between gap-3" role="group" aria-label="방문 인원">
            <button type="button" aria-label="한 명 줄이기" onClick={() => setParty((p) => Math.max(1, p - 1))} className="grid size-16 place-items-center rounded-xl bg-[#2a3034] text-3xl font-black hover:bg-[#343b40] active:scale-95">−</button>
            <div className="text-center" aria-live="polite">
              <span className="text-6xl font-black tabular-nums">{party}</span>
              <span className="ml-1 text-xl font-bold">명</span>
            </div>
            <button type="button" aria-label="한 명 늘리기" onClick={() => setParty((p) => Math.min(99, p + 1))} className="grid size-16 place-items-center rounded-xl bg-[#f1efe8] text-3xl font-black text-[#14171a] active:scale-95">+</button>
          </div>
          <div className="mt-3 flex gap-2">
            {[1, 2, 4, 6].map((n) => (
              <button key={n} type="button" onClick={() => setParty(n)} className={`h-10 flex-1 rounded-lg text-sm font-bold ${party === n ? "bg-[#f1efe8] text-[#14171a]" : "bg-[#2a3034] hover:bg-[#343b40]"}`}>{n}명</button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-black p-5 text-center ring-1 ring-[#2c3236]" aria-live="polite">
          <div className="text-sm font-semibold text-[#9aa09b]">지금 앉을 수 있는 의자</div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-[7.5rem] font-black leading-none tabular-nums text-[#35d07f] [text-shadow:0_0_40px_#35d07f66]">{free}</span>
            <span className="text-2xl font-bold text-[#35d07f]">/ {chairs.length}석</span>
          </div>
          {ok ? (
            <p className="mt-3 text-lg font-bold text-[#35d07f]">{party}명 앉을 수 있어요</p>
          ) : (
            <p className="mt-3 text-lg font-bold text-[#ffb81c]">좌석이 부족해요. {party}명이 앉기에는 {party - free}석 모자라요.</p>
          )}
        </div>
      </section>

      <section aria-label="운영 규칙" className="grid gap-3 sm:grid-cols-3">
        {[
          ["green", "초록불", "비어 있어요. 바로 앉으세요."],
          ["red", "빨간불", "누가 앉아 있어요."],
          ["yellow", "노란불", `자리를 비웠어요. ${demo ? "10초" : `${minutes}분`} 안에 돌아오지 않으면 빈자리가 돼요.`],
        ].map(([s, t, d]) => (
          <div key={s} className="flex gap-3 rounded-xl bg-[#1d2124] p-4 ring-1 ring-[#2c3236]">
            <Lamp status={s as "green"} size={22} />
            <div><div className="font-bold">{t}</div><div className="text-sm text-[#9aa09b]">{d}</div></div>
          </div>
        ))}
        <p className="rounded-xl bg-[#1d2124] p-4 text-sm text-[#9aa09b] ring-1 ring-[#2c3236] sm:col-span-3">
          직원이 확인한 뒤 소지품을 지정된 보관 바구니로 옮겨요. 돌아오시면 직원에게 말씀해 주세요. (제한 시간 {Math.round(limitMs / 1000) >= 60 ? `${limitMs / 60000}분` : `${limitMs / 1000}초`})
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">매장 좌석도</h2>
        <SeatMap compact />
      </section>
    </div>
  );
}

import { NavLink, Outlet, ScrollRestoration } from "react-router";
import { SeatsProvider, useSeats } from "./lib/seats";
import { configured } from "./lib/supabase";
import { Lamp } from "./components/Chair";

const tabs = [
  { to: "/", label: "입구 키오스크", end: true },
  { to: "/simulator", label: "의자 시뮬레이터" },
  { to: "/staff", label: "직원" },
];

function Shell() {
  const { ready, error, demo, setDemo } = useSeats();
  return (
    <div className="min-h-screen bg-[#0e1012] text-[#f1efe8] [word-break:keep-all]">
      <header className="sticky top-0 z-10 border-b border-[#2c3236] bg-[#14171a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-2 font-black tracking-tight">
            <span className="flex gap-1"><Lamp status="green" size={10} /><Lamp status="yellow" size={10} /><Lamp status="red" size={10} /></span>
            seat-signal
          </div>
          <nav className="flex gap-1 text-sm" aria-label="화면 이동">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `rounded-lg px-3 py-2 font-semibold ${isActive ? "bg-[#f1efe8] text-[#14171a]" : "text-[#9aa09b] hover:text-white"}`}>
                {t.label}
              </NavLink>
            ))}
          </nav>
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="size-5 accent-[#ffb81c]" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
            시연 모드 <span className="text-[#9aa09b]">({demo ? "10초" : "20분"})</span>
          </label>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">
        {error && <p role="alert" className="mb-4 rounded-xl bg-[#3a1a18] px-4 py-3 text-sm text-[#ffb3ad]">{error}</p>}
        {ready ? <Outlet /> : !error && <p className="py-20 text-center text-[#9aa09b]">좌석 정보를 불러오는 중이에요…</p>}
      </div>
    </div>
  );
}

export default function App() {
  if (!configured)
    return (
      <main className="grid min-h-screen place-items-center bg-[#0e1012] p-6 text-center text-[#f1efe8]">
        <div>
          <h1 className="text-xl font-bold">연결 설정이 비어 있어요</h1>
          <p className="mt-2 text-[#9aa09b]">VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 환경 변수에 넣어 주세요.</p>
        </div>
      </main>
    );
  return (
    <SeatsProvider>
      <Shell />
      <ScrollRestoration />
    </SeatsProvider>
  );
}

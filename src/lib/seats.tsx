import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type Status = "green" | "red" | "yellow";
export type Chair = { id: number; table_number: number; status: Status; away_started_at: string | null; updated_at: string };
export type StaffLog = { id: number; chair_id: number; message: string; created_at: string; handled_at: string | null };
export type ChairEvent = { id: number; chair_id: number; from_status: Status; to_status: Status; reason: string; created_at: string };

export const statusLabel: Record<Status, string> = { green: "빈자리", red: "사용 중", yellow: "자리 비움" };

type Ctx = {
  ready: boolean;
  error: string | null;
  chairs: Chair[];
  logs: StaffLog[];
  events: ChairEvent[];
  demo: boolean;
  minutes: number;
  limitMs: number;
  now: number;
  free: number;
  remainingMs: (c: Chair) => number | null;
  tap: (id: number) => Promise<void>;
  setDemo: (on: boolean) => Promise<void>;
  setMinutes: (m: number) => Promise<void>;
  handleLog: (id: number) => Promise<void>;
  resetDemo: () => Promise<void>;
  addChair: () => Promise<void>;
  removeChair: () => Promise<void>;
};

const SeatsContext = createContext<Ctx | null>(null);
export const useSeats = () => {
  const v = useContext(SeatsContext);
  if (!v) throw new Error("SeatsProvider missing");
  return v;
};

export function SeatsProvider({ children }: { children: ReactNode }) {
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [logs, setLogs] = useState<StaffLog[]>([]);
  const [events, setEvents] = useState<ChairEvent[]>([]);
  const [demo, setDemoState] = useState(true);
  const [minutes, setMinutesState] = useState(20);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const offset = useRef(0);
  const lastExpire = useRef(0);

  const load = useCallback(async () => {
    const t0 = Date.now();
    const [c, s, l, e, t] = await Promise.all([
      supabase.from("chairs").select("*").order("id"),
      supabase.from("app_settings").select("demo_mode, away_minutes").eq("id", 1).maybeSingle(),
      supabase.from("staff_logs").select("*").order("id", { ascending: false }).limit(50),
      supabase.from("chair_events").select("*").order("id", { ascending: false }).limit(60),
      supabase.rpc("server_now"),
    ]);
    const failed = c.error || s.error || l.error || e.error;
    if (failed) {
      setError("좌석 정보를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.");
      return;
    }
    if (typeof t.data === "string") offset.current = new Date(t.data).getTime() - (t0 + Date.now()) / 2;
    setChairs(c.data as Chair[]);
    setDemoState(s.data?.demo_mode ?? true);
    setMinutesState(s.data?.away_minutes ?? 20);
    setLogs(l.data as StaffLog[]);
    setEvents(e.data as ChairEvent[]);
    setError(null);
    setReady(true);
  }, []);

  useEffect(() => {
    load();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reload = () => {
      clearTimeout(timer);
      timer = setTimeout(load, 120);
    };
    const channel = supabase
      .channel("seat-signal")
      .on("postgres_changes", { event: "*", schema: "public" }, reload)
      .subscribe();
    const poll = setInterval(load, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const limitMs = demo ? 10_000 : minutes * 60_000;
  const serverNow = now + offset.current;

  const remainingMs = useCallback(
    (c: Chair) => (c.status === "yellow" && c.away_started_at ? limitMs - (serverNow - new Date(c.away_started_at).getTime()) : null),
    [limitMs, serverNow],
  );

  useEffect(() => {
    const overdue = chairs.some((c) => (remainingMs(c) ?? 1) <= 0);
    if (overdue && now - lastExpire.current > 1500) {
      lastExpire.current = now;
      supabase.rpc("expire_chairs").then(({ error: err }) => {
        if (!err) load();
      });
    }
  }, [chairs, remainingMs, now, load]);

  const act = useCallback(
    async (fn: () => PromiseLike<{ error: unknown }>) => {
      const { error: err } = await fn();
      if (err) setError("저장하지 못했어요. 다시 눌러 주세요.");
      await load();
    },
    [load],
  );

  const value = useMemo<Ctx>(
    () => ({
      ready,
      error,
      chairs,
      logs,
      events,
      demo,
      minutes,
      limitMs,
      now,
      free: chairs.filter((c) => c.status === "green").length,
      remainingMs,
      tap: (id) => act(() => supabase.rpc("tap_chair", { p_id: id })),
      setDemo: async (on) => {
        setDemoState(on);
        await act(() => supabase.rpc("set_demo_mode", { p_on: on }));
      },
      setMinutes: async (m) => {
        const v = Math.max(1, Math.min(180, m));
        setMinutesState(v);
        await act(() => supabase.rpc("set_away_minutes", { p_min: v }));
      },
      handleLog: (id) => act(() => supabase.rpc("handle_log", { p_id: id })),
      resetDemo: () => act(() => supabase.rpc("reset_demo")),
      addChair: () => act(() => supabase.rpc("add_chair")),
      removeChair: async () => {
        const { error: err } = await supabase.rpc("remove_chair");
        setError(err ? "마지막 번호 의자가 사용 중이거나 마지막 한 개라서 지울 수 없어요. 빈 의자(초록불)일 때만 지울 수 있어요." : null);
        await load();
      },
    }),
    [ready, error, chairs, logs, events, demo, minutes, limitMs, now, remainingMs, act],
  );

  return <SeatsContext.Provider value={value}>{children}</SeatsContext.Provider>;
}

export function fmtRemain(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

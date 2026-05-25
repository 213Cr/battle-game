import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MoveType, BasicMoveType, SpecialMoveType, StatTarget, MoveChoice,
  Fighter, TurnMessage,
  STAT_TOTAL, STAT_MIN, BASE_HP,
  BASIC_MOVES, SPECIAL_MOVES, MOVE_LABELS, STAT_LABELS_SHORT,
  makeInitialFighter, processTurn,
} from "@/lib/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

// =========================================================
// 型
// =========================================================

type Phase     = "setup" | "battle" | "end";
type BattleStep = "choosing" | "phase1" | "phase2";

interface StatAlloc { hp: number; a: number; b: number; s: number; t: number; }
const DEFAULT_ALLOC: StatAlloc = { hp: 0, a: STAT_MIN, b: STAT_MIN, s: STAT_MIN, t: STAT_MIN };
const ALLOC_KEYS: (keyof StatAlloc)[] = ["hp", "a", "b", "s", "t"];
const STAT_MIN_MAP: Record<keyof StatAlloc, number> = { hp: 0, a: STAT_MIN, b: STAT_MIN, s: STAT_MIN, t: STAT_MIN };
const SETUP_LABELS: Record<keyof StatAlloc, string> = {
  hp: "HP強化", a: "攻撃", b: "防御", s: "スピード", t: "特殊技(T)",
};

function usedPoints(alloc: StatAlloc) {
  return ALLOC_KEYS.reduce((sum, k) => sum + alloc[k], 0);
}

// バトルキューアイテム
type QueueItem =
  | { type: "message";    msg: TurnMessage; phase: 1 | 2; turn: number }
  | { type: "phase2_start"; fighterA: Fighter; fighterB: Fighter }
  | { type: "turn_end";   winner: "A" | "B" | null; isDraw: boolean };

interface LogEntry { turn: number; phase: 1 | 2; messages: TurnMessage[]; }

// =========================================================
// ステータス振り分けパネル
// =========================================================

function StatAllocPanel({ name, alloc, setAlloc, color }: {
  name: string; alloc: StatAlloc; setAlloc: (a: StatAlloc) => void; color: "primary" | "secondary";
}) {
  const used = usedPoints(alloc);
  const remaining = STAT_TOTAL - used;
  const colorCls  = color === "primary" ? "text-primary" : "text-secondary";
  const borderCls = color === "primary" ? "border-primary/30" : "border-secondary/30";

  const setValue = (key: keyof StatAlloc, raw: number) => {
    const min  = STAT_MIN_MAP[key];
    const max  = alloc[key] + remaining;
    const next = Math.max(min, Math.min(max, Math.round(raw)));
    if (next === alloc[key]) return;
    setAlloc({ ...alloc, [key]: next });
  };

  const sliderClass = (key: keyof StatAlloc) => {
    const base = "stat-slider";
    if (key === "hp") return `${base} green`;
    if (key === "t")  return `${base} pink`;
    return color === "secondary" ? `${base} secondary` : base;
  };

  const labelColor = (key: keyof StatAlloc) => {
    if (key === "hp") return "text-green-400";
    if (key === "t")  return "text-pink-400";
    return "text-muted-foreground";
  };

  const inputBorder = (key: keyof StatAlloc) => {
    if (key === "hp") return "border-green-500/40 focus:border-green-400";
    if (key === "t")  return "border-pink-500/40 focus:border-pink-400";
    return color === "primary"
      ? "border-primary/30 focus:border-primary"
      : "border-secondary/30 focus:border-secondary";
  };

  return (
    <div className={`border ${borderCls} rounded-xl p-4 space-y-3 bg-card/30`}>
      <div className="flex justify-between items-center">
        <span className={`font-black text-base ${colorCls}`}>{name}</span>
        <span className="text-xs text-muted-foreground font-mono">
          最終HP: <span className="text-foreground font-bold">{BASE_HP + alloc.hp}</span>
          <span className="ml-3">
            残り{" "}
            <span className={`font-bold ${remaining === 0 ? "text-green-400" : remaining < 10 ? "text-yellow-400" : "text-foreground"}`}>
              {remaining}
            </span>{" "}pt
          </span>
        </span>
      </div>

      <div className="space-y-3">
        {ALLOC_KEYS.map((key) => {
          const min = STAT_MIN_MAP[key];
          const max = alloc[key] + remaining;
          const val = alloc[key];
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold ${labelColor(key)}`}>
                  {SETUP_LABELS[key]}
                  {key === "hp" && <span className="text-muted-foreground font-normal"> (基礎 {BASE_HP})</span>}
                </span>
                <input
                  type="number" min={min} max={max} value={val}
                  onChange={(e) => { const p = parseInt(e.target.value,10); if (!isNaN(p)) setValue(key, p); }}
                  onBlur={(e) => { const p = parseInt(e.target.value,10); setValue(key, isNaN(p) ? min : p); }}
                  className={`w-16 h-7 rounded border bg-background/60 text-center text-xs font-mono font-bold
                    outline-none transition-colors ${inputBorder(key)} ${labelColor(key)}`}
                />
              </div>
              <input
                type="range" min={min} max={max} value={val}
                onChange={(e) => setValue(key, parseInt(e.target.value, 10))}
                className={sliderClass(key)}
              />
            </div>
          );
        })}
      </div>

      {remaining === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center text-xs text-green-400 font-bold tracking-widest pt-1">振り分け完了</motion.div>
      )}
    </div>
  );
}

// =========================================================
// メイン
// =========================================================

export default function Battle() {
  const [phase,   setPhase]   = useState<Phase>("setup");
  const [nameA,   setNameA]   = useState("プレイヤー1");
  const [nameB,   setNameB]   = useState("プレイヤー2");
  const [allocA,  setAllocA]  = useState<StatAlloc>({ ...DEFAULT_ALLOC });
  const [allocB,  setAllocB]  = useState<StatAlloc>({ ...DEFAULT_ALLOC });

  const [fighterA, setFighterA] = useState<Fighter>(makeInitialFighter("A","A",0,5,5,5,5));
  const [fighterB, setFighterB] = useState<Fighter>(makeInitialFighter("B","B",0,5,5,5,5));

  // ── 技選択状態（ファイターごと） ──
  // pending: サブ選択（バフ先/デバフ先/封印技）の選択中
  // confirm: 最終確認待ち（サブ選択の結果 or 直接選択）
  // choice : 確定済み（両者揃ったらターン実行）
  const [pendingA,  setPendingA]  = useState<MoveType | null>(null);
  const [pendingB,  setPendingB]  = useState<MoveType | null>(null);
  const [confirmA,  setConfirmA]  = useState<MoveChoice | null>(null);
  const [confirmB,  setConfirmB]  = useState<MoveChoice | null>(null);
  const [choiceA,   setChoiceA]   = useState<MoveChoice | null>(null);
  const [choiceB,   setChoiceB]   = useState<MoveChoice | null>(null);

  // ── バトルフェーズ管理 ──
  const [battleStep, setBattleStep] = useState<BattleStep>("choosing");
  const [firstId,    setFirstId]    = useState<"A" | "B" | null>(null);
  const [turn,       setTurn]       = useState(1);
  const [winner,     setWinner]     = useState<string | null>(null);

  // ── ログキューと表示済みログ ──
  const [battleQueue, setBattleQueue] = useState<QueueItem[]>([]);
  const [shownLogs,   setShownLogs]   = useState<LogEntry[]>([]);
  const logBottomRef  = useRef<HTMLDivElement | null>(null);

  const canStart = usedPoints(allocA) === STAT_TOTAL && usedPoints(allocB) === STAT_TOTAL;

  // =========================================================
  // ゲーム開始
  // =========================================================

  const startGame = () => {
    setFighterA(makeInitialFighter("A", nameA, allocA.hp, allocA.a, allocA.b, allocA.s, allocA.t));
    setFighterB(makeInitialFighter("B", nameB, allocB.hp, allocB.a, allocB.b, allocB.s, allocB.t));
    setPhase("battle");
    setTurn(1); setShownLogs([]); setBattleQueue([]); setWinner(null);
    setChoiceA(null); setChoiceB(null);
    setConfirmA(null); setConfirmB(null);
    setPendingA(null); setPendingB(null);
    setBattleStep("choosing"); setFirstId(null);
  };

  // =========================================================
  // 技選択ロジック
  // =========================================================

  const needsSub = (m: MoveType) => ["sp_buff", "sp_debuff", "sp_lock"].includes(m);

  // 技ボタンをクリック
  const selectMove = (side: "A" | "B", move: MoveType) => {
    if (needsSub(move)) {
      // サブ選択が必要→サブパネルを表示
      if (side === "A") { setPendingA(move); setConfirmA(null); }
      else              { setPendingB(move); setConfirmB(null); }
    } else {
      // 直接確認パネルへ
      if (side === "A") { setConfirmA({ move }); setPendingA(null); }
      else              { setConfirmB({ move }); setPendingB(null); }
    }
  };

  // サブ選択完了（ステータス選択）
  const selectSubStat = (side: "A" | "B", stat: StatTarget) => {
    const move = side === "A" ? pendingA : pendingB;
    if (!move) return;
    const choice: MoveChoice = { move, statTarget: stat };
    if (side === "A") { setConfirmA(choice); setPendingA(null); }
    else              { setConfirmB(choice); setPendingB(null); }
  };

  // サブ選択完了（封印技選択）
  const selectSubLock = (side: "A" | "B", lock: MoveType) => {
    const choice: MoveChoice = { move: "sp_lock", lockTarget: lock };
    if (side === "A") { setConfirmA(choice); setPendingA(null); }
    else              { setConfirmB(choice); setPendingB(null); }
  };

  // 確認パネルで「決定」
  const commitConfirm = (side: "A" | "B") => {
    if (side === "A" && confirmA) { setChoiceA(confirmA); setConfirmA(null); }
    if (side === "B" && confirmB) { setChoiceB(confirmB); setConfirmB(null); }
  };

  // 確認パネルで「戻る」 → 技選択に戻る
  const cancelConfirm = (side: "A" | "B") => {
    if (side === "A") { setConfirmA(null); setPendingA(null); }
    if (side === "B") { setConfirmB(null); setPendingB(null); }
  };

  // サブパネルで「戻る」 → 技選択に戻る
  const cancelSub = (side: "A" | "B") => {
    if (side === "A") { setPendingA(null); setConfirmA(null); }
    if (side === "B") { setPendingB(null); setConfirmB(null); }
  };

  // =========================================================
  // ターン実行（両者の技が確定したとき）
  // =========================================================

  useEffect(() => {
    if (choiceA && choiceB && phase === "battle" && battleStep === "choosing") {
      const result = processTurn(fighterA, fighterB, choiceA, choiceB);
      const currentTurn = turn;

      // 先攻フェーズ開始: 中間状態を表示
      setFighterA(result.fighterAAfterPhase1);
      setFighterB(result.fighterBAfterPhase1);
      setFirstId(result.firstId);
      setBattleStep("phase1");

      // キューを構築
      const items: QueueItem[] = [
        ...result.firstMessages.map((m): QueueItem => ({ type: "message", msg: m, phase: 1, turn: currentTurn })),
      ];

      if (result.winnerAfterPhase1 !== null || result.isDrawAfterPhase1) {
        // 先攻フェーズで決着
        items.push({ type: "turn_end", winner: result.winner, isDraw: result.isDraw });
      } else {
        // 後攻フェーズへ
        items.push({ type: "phase2_start", fighterA: result.fighterA, fighterB: result.fighterB });
        items.push(...result.secondMessages.map((m): QueueItem => ({ type: "message", msg: m, phase: 2, turn: currentTurn })));
        items.push({ type: "turn_end", winner: result.winner, isDraw: result.isDraw });
      }

      setBattleQueue(items);
    }
  }, [choiceA, choiceB]);

  // =========================================================
  // キュー処理（160ms ごとに1アイテム、phase2_start は 500ms 間隔）
  // =========================================================

  useEffect(() => {
    if (battleQueue.length === 0) return;
    const [first] = battleQueue;
    const delay = first.type === "phase2_start" ? 500 : 160;

    const timer = setTimeout(() => {
      setBattleQueue((prev) => {
        if (prev.length === 0) return prev;
        const [item, ...rest] = prev;

        switch (item.type) {
          case "message":
            setShownLogs((logs) => {
              const last = logs[logs.length - 1];
              if (last && last.turn === item.turn && last.phase === item.phase) {
                return [...logs.slice(0, -1), { ...last, messages: [...last.messages, item.msg] }];
              }
              return [...logs, { turn: item.turn, phase: item.phase, messages: [item.msg] }];
            });
            setBattleStep(item.phase === 1 ? "phase1" : "phase2");
            break;

          case "phase2_start":
            // 後攻フェーズ: ファイターを最終状態に更新
            setFighterA(item.fighterA);
            setFighterB(item.fighterB);
            setBattleStep("phase2");
            break;

          case "turn_end":
            if (item.winner || item.isDraw) {
              setWinner(item.isDraw ? null : (item.winner === "A" ? fighterA.name : fighterB.name));
              setPhase("end");
            } else {
              setTurn((t) => t + 1);
              setChoiceA(null); setChoiceB(null);
              setConfirmA(null); setConfirmB(null);
              setPendingA(null); setPendingB(null);
              setBattleStep("choosing");
            }
            break;
        }

        return rest;
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [battleQueue]);

  // 最下部へ自動スクロール
  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [shownLogs]);

  // =========================================================
  // 描画
  // =========================================================

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center p-3 md:p-6 font-mono overflow-x-hidden">

      {/* ===== 設定画面 ===== */}
      {phase === "setup" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mt-6 space-y-5">
          <h1 className="text-3xl md:text-4xl font-black text-center tracking-tighter text-primary"
            style={{ textShadow: "0 0 12px rgba(255,0,255,0.6)" }}>ネオン決闘</h1>
          <p className="text-center text-xs text-muted-foreground">
            各ファイターに <span className="text-foreground font-bold">{STAT_TOTAL}</span> ポイントを振り分けてください
            （HP強化は最低0、攻撃/防御/スピード/特殊技は最低 {STAT_MIN}）
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-primary font-bold text-xs">ファイターA の名前</Label>
              <Input value={nameA} onChange={(e) => setNameA(e.target.value)}
                className="bg-background/50 border-primary/30 focus-visible:ring-primary font-mono text-sm" />
              <StatAllocPanel name={nameA || "A"} alloc={allocA} setAlloc={setAllocA} color="primary" />
            </div>
            <div className="space-y-2">
              <Label className="text-secondary font-bold text-xs">ファイターB の名前</Label>
              <Input value={nameB} onChange={(e) => setNameB(e.target.value)}
                className="bg-background/50 border-secondary/30 focus-visible:ring-secondary font-mono text-sm" />
              <StatAllocPanel name={nameB || "B"} alloc={allocB} setAlloc={setAllocB} color="secondary" />
            </div>
          </div>
          <Button className="w-full h-12 text-base font-bold tracking-widest bg-primary hover:bg-primary/90 disabled:opacity-40"
            onClick={startGame} disabled={!canStart}>
            {canStart ? "アリーナへ" : "ポイントを全て振り分けてください"}
          </Button>
        </motion.div>
      )}

      {/* ===== 戦闘画面 ===== */}
      {(phase === "battle" || phase === "end") && (
        <div className="w-full max-w-6xl flex flex-col gap-4">

          {/* ヘッダー（ターン + 先攻後攻バナー） */}
          <div className="flex justify-between items-center px-2 py-2 border-b border-border/50">
            <span className="text-lg font-bold tracking-widest text-primary/80">ターン {turn}</span>

            {/* 先攻後攻インジケーター */}
            {firstId && battleStep !== "choosing" && (
              <motion.div
                key={`${turn}-${firstId}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 text-xs font-bold">
                <span className={`px-2 py-1 rounded border ${battleStep === "phase1"
                  ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 animate-pulse"
                  : "opacity-40 border-border text-muted-foreground"}`}>
                  ⚡先攻 {firstId === "A" ? fighterA.name : fighterB.name}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className={`px-2 py-1 rounded border ${battleStep === "phase2"
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse"
                  : "opacity-40 border-border text-muted-foreground"}`}>
                  後攻 {firstId === "A" ? fighterB.name : fighterA.name}
                </span>
              </motion.div>
            )}

            {phase === "end" && (
              <span className="text-xl font-black text-white animate-pulse"
                style={{ textShadow: "0 0 20px rgba(255,255,255,0.8)" }}>試合終了</span>
            )}
          </div>

          {/* ファイターカード */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch w-full">
            <FighterCard
              fighter={fighterA} color="primary"
              committed={!!choiceA} pending={pendingA} confirm={confirmA}
              isActing={firstId === "A" ? battleStep === "phase1" : battleStep === "phase2"}
              isFirst={firstId === "A"}
              onSelect={(m)    => selectMove("A", m)}
              onSubStat={(s)   => selectSubStat("A", s)}
              onSubLock={(l)   => selectSubLock("A", l)}
              onCancelSub={()  => cancelSub("A")}
              onConfirm={()    => commitConfirm("A")}
              onCancelConfirm={() => cancelConfirm("A")}
              disabled={!!choiceA || phase === "end" || battleStep !== "choosing"}
            />
            <div className="text-3xl font-black text-muted-foreground opacity-30 shrink-0 flex items-center justify-center">対</div>
            <FighterCard
              fighter={fighterB} color="secondary"
              committed={!!choiceB} pending={pendingB} confirm={confirmB}
              isActing={firstId === "B" ? battleStep === "phase1" : battleStep === "phase2"}
              isFirst={firstId === "B"}
              onSelect={(m)    => selectMove("B", m)}
              onSubStat={(s)   => selectSubStat("B", s)}
              onSubLock={(l)   => selectSubLock("B", l)}
              onCancelSub={()  => cancelSub("B")}
              onConfirm={()    => commitConfirm("B")}
              onCancelConfirm={() => cancelConfirm("B")}
              disabled={!!choiceB || phase === "end" || battleStep !== "choosing"}
            />
          </div>

          {/* 戦闘ログ */}
          <div className="border border-border/50 rounded-xl bg-card/50 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 bg-border/30 px-4 py-1.5">
              <span className="text-xs font-bold text-muted-foreground tracking-widest">戦闘ログ</span>
              {battleQueue.length > 0 && (
                <span className="flex gap-0.5">
                  {[0,1,2].map((i) => (
                    <motion.span key={i} className="w-1 h-1 rounded-full bg-primary inline-block"
                      animate={{ opacity: [0.2,1,0.2] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </span>
              )}
            </div>
            <ScrollArea className="p-3 max-h-60">
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {shownLogs.map((entry) => (
                    <motion.div key={`${entry.turn}-${entry.phase}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`border-l-2 pl-3 space-y-0.5 ${entry.phase === 1 ? "border-yellow-500/60" : "border-cyan-500/60"}`}>
                      <div className="text-[10px] font-bold flex items-center gap-1.5">
                        <span className="text-muted-foreground">ターン {entry.turn}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          entry.phase === 1
                            ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-cyan-500/15 text-cyan-400"}`}>
                          {entry.phase === 1 ? "⚡先攻" : "後攻"}
                        </span>
                      </div>
                      <AnimatePresence initial={false}>
                        {entry.messages.map((m) => (
                          <motion.div key={m.id}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`text-xs leading-snug ${msgColor(m.kind)}`}>
                            {m.text}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={logBottomRef} />
              </div>
            </ScrollArea>
          </div>

          {/* 終了画面 */}
          <AnimatePresence>
            {phase === "end" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur p-4">
                <div className="max-w-md w-full bg-card border border-primary/50 p-8 rounded-2xl text-center space-y-8
                  shadow-[0_0_80px_rgba(255,0,255,0.2)]">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-muted-foreground tracking-widest">勝者</h2>
                    <h1 className="text-5xl font-black text-white tracking-tighter"
                      style={{ textShadow: "0 0 20px rgba(255,255,255,0.8)" }}>{winner ?? "引き分け"}</h1>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 h-11" onClick={() => setPhase("setup")}>新しいファイター</Button>
                    <Button className="flex-1 h-11 bg-primary hover:bg-primary/90" onClick={startGame}>再戦</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// =========================================================
// ログの色分け
// =========================================================

function msgColor(kind: TurnMessage["kind"]) {
  switch (kind) {
    case "damage":  return "text-orange-300";
    case "heal":    return "text-green-400";
    case "buff":    return "text-cyan-400";
    case "debuff":  return "text-yellow-400";
    case "reflect": return "text-purple-400";
    case "lock":    return "text-red-400";
    case "warn":    return "text-red-300 opacity-80";
    case "header":  return "text-white font-bold";
    default:        return "text-foreground/70";
  }
}

// =========================================================
// ファイターカード
// =========================================================

interface FloatAnim { value: number; key: string; }
interface StatAnim  { a?: number; b?: number; s?: number; key: string; }

function FighterCard({
  fighter, color, committed, pending, confirm, isActing, isFirst,
  onSelect, onSubStat, onSubLock, onCancelSub, onConfirm, onCancelConfirm, disabled,
}: {
  fighter: Fighter;
  color: "primary" | "secondary";
  committed: boolean;
  pending: MoveType | null;
  confirm: MoveChoice | null;
  isActing: boolean;
  isFirst: boolean;
  onSelect: (m: MoveType) => void;
  onSubStat: (stat: StatTarget) => void;
  onSubLock: (lock: MoveType) => void;
  onCancelSub: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  disabled: boolean;
}) {
  // ── HP / ステータス変化アニメーション ──
  const prevHpRef    = useRef(fighter.hp);
  const prevStatsRef = useRef({ a: fighter.a, b: fighter.b, s: fighter.s });
  const [hpAnim,   setHpAnim]   = useState<FloatAnim | null>(null);
  const [statAnim, setStatAnim] = useState<StatAnim  | null>(null);

  useEffect(() => {
    const prev = prevHpRef.current;
    if (fighter.hp !== prev) {
      setHpAnim({ value: fighter.hp - prev, key: `${Date.now()}` });
    }
    prevHpRef.current = fighter.hp;
  }, [fighter.hp]);

  useEffect(() => {
    const prev = prevStatsRef.current;
    const changes: Omit<StatAnim, "key"> = {};
    if (fighter.a !== prev.a) changes.a = fighter.a - prev.a;
    if (fighter.b !== prev.b) changes.b = fighter.b - prev.b;
    if (fighter.s !== prev.s) changes.s = fighter.s - prev.s;
    if (Object.keys(changes).length > 0) setStatAnim({ ...changes, key: `${Date.now()}` });
    prevStatsRef.current = { a: fighter.a, b: fighter.b, s: fighter.s };
  }, [fighter.a, fighter.b, fighter.s]);

  const hpPct   = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  const bgBar   = color === "primary" ? "bg-primary" : "bg-secondary";
  const textC   = color === "primary" ? "text-primary" : "text-secondary";
  const barColor = hpPct > 50 ? bgBar : hpPct > 25 ? "bg-yellow-500" : "bg-red-500";

  const actingGlow = isActing
    ? isFirst
      ? "ring-2 ring-yellow-400/60 shadow-[0_0_18px_rgba(250,204,21,0.25)]"
      : "ring-2 ring-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
    : "";

  const statDiff = (current: number, base: number) => {
    if (current > base) return <span className="text-green-400 text-[9px] ml-0.5">↑</span>;
    if (current < base) return <span className="text-red-400 text-[9px] ml-0.5">↓</span>;
    return null;
  };

  // ステータスラベル（変化時に色フラッシュ）
  const StatVal = ({ val, prev, label, extra }: { val: number; prev: number; label: string; extra?: string }) => (
    <motion.span
      key={val}
      initial={val !== prev ? { color: val > prev ? "#4ade80" : "#f87171", scale: 1.3 } : false}
      animate={{ color: "inherit", scale: 1 }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-0.5">
      {label}{val}{statDiff(val, prev)}{extra && <span className="text-pink-400 ml-1">{extra}</span>}
    </motion.span>
  );

  return (
    <div className={`flex-1 w-full flex flex-col gap-2 p-3 rounded-xl border border-border/50 bg-card/30 backdrop-blur relative overflow-hidden
      transition-all duration-300 ${actingGlow} ${committed ? "opacity-50 grayscale" : ""}`}>

      {/* ── 浮き数字: HP変化 ── */}
      <AnimatePresence>
        {hpAnim && (
          <motion.div key={hpAnim.key}
            initial={{ opacity: 1, y: 0, x: 0 }}
            animate={{ opacity: 0, y: -56 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            onAnimationComplete={() => setHpAnim(null)}
            className={`absolute top-8 right-6 text-2xl font-black pointer-events-none z-30 select-none
              ${hpAnim.value < 0 ? "text-red-400" : "text-green-400"}`}
            style={{ textShadow: hpAnim.value < 0 ? "0 0 12px rgba(248,113,113,0.7)" : "0 0 12px rgba(74,222,128,0.7)" }}>
            {hpAnim.value > 0 ? `+${hpAnim.value}` : hpAnim.value}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 浮き数字: ステータス変化 ── */}
      <AnimatePresence>
        {statAnim && (
          <motion.div key={statAnim.key}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -36 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            onAnimationComplete={() => setStatAnim(null)}
            className="absolute top-16 left-3 flex gap-2 pointer-events-none z-30 select-none">
            {statAnim.a !== undefined && (
              <span className={`text-xs font-black ${statAnim.a > 0 ? "text-green-400" : "text-red-400"}`}
                style={{ textShadow: "0 0 8px currentColor" }}>
                攻{statAnim.a > 0 ? `+${statAnim.a}` : statAnim.a}
              </span>
            )}
            {statAnim.b !== undefined && (
              <span className={`text-xs font-black ${statAnim.b > 0 ? "text-green-400" : "text-red-400"}`}
                style={{ textShadow: "0 0 8px currentColor" }}>
                防{statAnim.b > 0 ? `+${statAnim.b}` : statAnim.b}
              </span>
            )}
            {statAnim.s !== undefined && (
              <span className={`text-xs font-black ${statAnim.s > 0 ? "text-green-400" : "text-red-400"}`}
                style={{ textShadow: "0 0 8px currentColor" }}>
                速{statAnim.s > 0 ? `+${statAnim.s}` : statAnim.s}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 先攻/後攻バッジ（フェーズ中のみ） */}
      {isActing && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full
            ${isFirst ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"}`}>
          {isFirst ? "⚡先攻" : "後攻"}
        </motion.div>
      )}

      {/* 名前・HP */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className={`text-xl font-black tracking-tighter ${textC}`}
            style={{ textShadow: `0 0 8px var(--${color})` }}>{fighter.name}</h2>
          <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
            <StatVal val={fighter.a} prev={fighter.baseA} label="攻:" />
            <StatVal val={fighter.b} prev={fighter.baseB} label="防:" />
            <StatVal val={fighter.s} prev={fighter.baseS} label="速:" />
            <span className="text-pink-400">特:{fighter.t}</span>
          </div>
        </div>
        <div className="text-right">
          <motion.div key={fighter.hp}
            initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}
            className="text-2xl font-black leading-none">
            {Math.max(0, fighter.hp)}
          </motion.div>
          <div className="text-[10px] text-muted-foreground font-bold">/ {fighter.maxHp} HP</div>
        </div>
      </div>

      {/* HP バー */}
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/30">
        <motion.div className={`h-full ${barColor}`}
          animate={{ width: `${hpPct}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
          style={{ boxShadow: `0 0 8px var(--${color})` }} />
      </div>

      {/* ステータス効果バッジ */}
      <div className="flex gap-1 flex-wrap min-h-[16px]">
        {fighter.reflecting > 0 && (
          <span className="text-[9px] bg-purple-900/50 text-purple-300 border border-purple-500/40 rounded px-1 py-0.5">
            反射 {Math.round(fighter.reflecting * 100)}%
          </span>
        )}
        {fighter.lockedMove && (
          <span className="text-[9px] bg-red-900/50 text-red-300 border border-red-500/40 rounded px-1 py-0.5">
            封印: {MOVE_LABELS[fighter.lockedMove]}
          </span>
        )}
        {fighter.ct_strong > 0 && (
          <span className="text-[9px] bg-orange-900/50 text-orange-300 border border-orange-500/40 rounded px-1 py-0.5">
            強攻撃 CT:{fighter.ct_strong}
          </span>
        )}
      </div>

      {/* ── 最終確認パネル ── */}
      <AnimatePresence>
        {confirm && !disabled && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className={`border rounded-lg p-3 bg-card/80 space-y-3 mt-1
              ${color === "primary" ? "border-primary/40" : "border-secondary/40"}`}>
            <div className="text-center space-y-1">
              <div className="text-[10px] text-muted-foreground">この技で決定しますか？</div>
              <div className={`text-base font-black ${color === "primary" ? "text-primary" : "text-secondary"}`}>
                {MOVE_LABELS[confirm.move]}
              </div>
              {confirm.statTarget && (
                <div className="text-[11px] text-muted-foreground">
                  対象: <span className="text-foreground font-bold">{STAT_LABELS_SHORT[confirm.statTarget]}</span>
                </div>
              )}
              {confirm.lockTarget && (
                <div className="text-[11px] text-muted-foreground">
                  封印: <span className="text-red-400 font-bold">{MOVE_LABELS[confirm.lockTarget]}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onCancelConfirm}
                className="flex-1 h-8 text-xs font-bold rounded border border-border/50 bg-background/50
                  hover:border-muted-foreground transition-colors">
                ← 戻る
              </button>
              <button onClick={onConfirm}
                className={`flex-1 h-8 text-xs font-black rounded transition-colors
                  ${color === "primary"
                    ? "bg-primary/20 border border-primary/60 text-primary hover:bg-primary/30"
                    : "bg-secondary/20 border border-secondary/60 text-secondary hover:bg-secondary/30"}`}>
                決定！
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── サブ選択UI ── */}
      {pending === "sp_buff" && !disabled && (
        <SubSelectPanel label="バフ：強化するステータスを選択" color={color} onBack={onCancelSub}>
          {(["a","b","s"] as StatTarget[]).map((stat) => (
            <SubBtn key={stat} label={STAT_LABELS_SHORT[stat]} onClick={() => onSubStat(stat)} color={color} />
          ))}
        </SubSelectPanel>
      )}
      {pending === "sp_debuff" && !disabled && (
        <SubSelectPanel label="デバフ：弱体化させるステータスを選択" color={color} onBack={onCancelSub}>
          {(["a","b","s"] as StatTarget[]).map((stat) => (
            <SubBtn key={stat} label={STAT_LABELS_SHORT[stat]} onClick={() => onSubStat(stat)} color={color} />
          ))}
        </SubSelectPanel>
      )}
      {pending === "sp_lock" && !disabled && (
        <SubSelectPanel label="行動制限：封じる技を選択" color={color} onBack={onCancelSub}>
          <div className="w-full space-y-1.5">
            <div className="text-[9px] text-muted-foreground tracking-widest text-center">基本技</div>
            <div className="flex gap-1 flex-wrap justify-center">
              {BASIC_MOVES.map((m) => (
                <SubBtn key={m} label={MOVE_LABELS[m]} onClick={() => onSubLock(m)} color={color} />
              ))}
            </div>
            <div className="text-[9px] text-muted-foreground tracking-widest text-center border-t border-border/30 pt-1">特殊技</div>
            <div className="flex gap-1 flex-wrap justify-center">
              {SPECIAL_MOVES.map((m) => (
                <SubBtn key={m} label={MOVE_LABELS[m]} onClick={() => onSubLock(m)} color={color} />
              ))}
            </div>
          </div>
        </SubSelectPanel>
      )}

      {/* ── 技ボタン ── */}
      {!pending && !confirm && (
        <div className="space-y-1.5 mt-1">
          <div className="grid grid-cols-5 gap-1">
            {(["normal","strong","fast","penetrate","combo"] as BasicMoveType[]).map((m) => (
              <MoveBtn key={m} label={MOVE_LABELS[m]} sub={MOVE_SUB[m]}
                onClick={() => onSelect(m)}
                disabled={disabled || (m === "strong" && fighter.ct_strong > 0)}
                color={color}
                cooldown={m === "strong" ? fighter.ct_strong : 0}
              />
            ))}
          </div>
          <div className="text-[9px] text-muted-foreground tracking-widest text-center border-t border-border/30 pt-1">── 特殊技 ──</div>
          <div className="grid grid-cols-4 gap-1">
            {(["sp_ratio","sp_drain","sp_ultra","sp_reflect"] as SpecialMoveType[]).map((m) => (
              <MoveBtn key={m} label={MOVE_LABELS[m]} sub={MOVE_SUB[m]}
                onClick={() => onSelect(m)} disabled={disabled} color={color} accent />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(["sp_buff","sp_debuff","sp_lock"] as SpecialMoveType[]).map((m) => (
              <MoveBtn key={m} label={MOVE_LABELS[m]} sub={MOVE_SUB[m]}
                onClick={() => onSelect(m)} disabled={disabled} color={color} accent needsSub />
            ))}
          </div>
        </div>
      )}

      {/* 準備完了オーバーレイ */}
      {committed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <span className="text-xl font-bold tracking-widest text-white animate-pulse">準備完了</span>
        </div>
      )}
    </div>
  );
}

// =========================================================
// 技の説明（長押しツールチップ用）
// =========================================================

const MOVE_SUB: Record<MoveType, string> = {
  normal:    "×1.0 ダメージ。防御を考慮した標準攻撃。",
  strong:    "×1.5 ダメージ。隔ターン制限あり。使用後スピード・防御 -15%。",
  fast:      "×0.55 ダメージ。スピードに関わらず常に先攻を取る。",
  penetrate: "×0.7 ダメージ。相手の防御を完全に無視して攻撃。",
  combo:     "×0.4×3連打。各ヒットで反射判定あり。合計ダメージは状況次第。",
  sp_ratio:  "敵最大HPの5〜10%を与える。防御無視。使用後スピード -10%。",
  sp_drain:  "×1.0 ダメージ＋与ダメの20〜40%を回復。使用後攻撃 -15%。",
  sp_ultra:  "15%の確率で攻撃×2.3の大技。発動時に防御が永続 -15%。",
  sp_reflect:"次の攻撃を30〜50%反射するスタンスを取る。使用後攻撃 -10%。",
  sp_buff:   "攻撃・防御・スピードのいずれか1つを +20%。代償として他ステータスが翌ターン低下。",
  sp_debuff: "相手の攻撃・防御・スピードのいずれか1つを -20%。代償として自分のステータスが翌ターン低下。",
  sp_lock:   "相手の指定した技を次ターン封印する。使用後スピード -25%。",
};

// =========================================================
// 汎用ボタン（長押しで説明表示 — portal ベースで見切れなし）
// =========================================================

function MoveBtn({ label, sub, onClick, disabled, color, cooldown = 0, accent = false, needsSub = false }: {
  label: string; sub: string; onClick: () => void; disabled: boolean;
  color: string; cooldown?: number; accent?: boolean; needsSub?: boolean;
}) {
  const [showTip, setShowTip]   = useState(false);
  const [tipPos,  setTipPos]    = useState<{ top: number; left: number } | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongRef = useRef(false);
  const btnRef    = useRef<HTMLButtonElement>(null);

  const startPress = () => {
    isLongRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongRef.current = true;
      if (btnRef.current) {
        const r  = btnRef.current.getBoundingClientRect();
        const TW = 208;
        let left = r.left + r.width / 2 - TW / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - TW - 8));
        setTipPos({ top: r.top, left });
      }
      setShowTip(true);
    }, 400);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTip(false); setTipPos(null);
  };

  const handlePointerUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLongRef.current && !disabled) onClick();
    isLongRef.current = false;
    setShowTip(false); setTipPos(null);
  };

  const hoverCls = accent
    ? "hover:border-pink-500 hover:text-pink-400"
    : color === "primary" ? "hover:border-primary hover:text-primary" : "hover:border-secondary hover:text-secondary";

  return (
    <>
      <button ref={btnRef}
        onPointerDown={startPress} onPointerUp={handlePointerUp}
        onPointerLeave={endPress}  onPointerCancel={endPress}
        disabled={disabled}
        style={{ userSelect: "none", WebkitUserSelect: "none", touchAction: "none" } as React.CSSProperties}
        className={`flex flex-col items-center justify-center p-1.5 border border-border/40 rounded-lg bg-background/50
          transition-all duration-150 relative
          ${accent ? "border-pink-500/25 text-pink-400/80" : ""}
          ${disabled ? "opacity-35 cursor-not-allowed" : `${hoverCls} hover:bg-card hover:scale-[1.02]`}`}>
        <span className="text-[10px] font-bold leading-tight text-center pointer-events-none">{label}</span>
        {needsSub && !disabled && (
          <span className="text-[7px] text-muted-foreground/60 pointer-events-none">▼選択</span>
        )}
        {cooldown > 0 && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center z-10 rounded-lg">
            <span className="text-red-400 text-[10px] font-black">CT {cooldown}</span>
          </div>
        )}
      </button>

      {/* portal でレンダリング → overflow:hidden に影響されない */}
      {showTip && tipPos && createPortal(
        <div style={{
          position: "fixed",
          top:  tipPos.top - 8,
          left: tipPos.left,
          transform: "translateY(-100%)",
          zIndex: 9999,
          width: 208,
          pointerEvents: "none",
        }}>
          <div className="bg-card/95 border border-border/70 rounded-xl px-3 py-2 shadow-2xl"
            style={{ backdropFilter: "blur(12px)" }}>
            <div className={`text-[11px] font-black mb-1 ${accent ? "text-pink-400" : color === "primary" ? "text-primary" : "text-secondary"}`}>
              {label}
            </div>
            <div className="text-[10px] text-muted-foreground leading-relaxed">{sub}</div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
            border-l-[6px] border-r-[6px] border-t-[6px]
            border-l-transparent border-r-transparent border-t-border/70" />
        </div>,
        document.body
      )}
    </>
  );
}

function SubSelectPanel({ label, color, onBack, children }: {
  label: string; color: "primary" | "secondary"; onBack: () => void; children: React.ReactNode;
}) {
  const borderCls = color === "primary" ? "border-primary/40" : "border-secondary/40";
  return (
    <div className={`border ${borderCls} rounded-lg p-2 bg-card/50 space-y-2 mt-1`}>
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5
            rounded border border-border/40 hover:border-muted-foreground">
          ← 戻る
        </button>
        <div className="text-[10px] text-muted-foreground text-center flex-1 tracking-wide">{label}</div>
        <div className="w-12" />
      </div>
      <div className="flex gap-1.5 justify-center flex-wrap">{children}</div>
    </div>
  );
}

function SubBtn({ label, onClick, color }: {
  label: string; onClick: () => void; color: "primary" | "secondary";
}) {
  const cls = color === "primary"
    ? "border-primary/50 text-primary hover:bg-primary/20"
    : "border-secondary/50 text-secondary hover:bg-secondary/20";
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all hover:scale-105 ${cls}`}>
      {label}
    </button>
  );
}

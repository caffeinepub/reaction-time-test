import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "waiting" | "ready" | "result" | "too-early" | "summary";

const TOTAL_ROUNDS = 5;

function getAverage(times: number[]): number {
  if (times.length === 0) return 0;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

function getBest(times: number[]): number {
  if (times.length === 0) return 0;
  return Math.min(...times);
}

function getRating(ms: number): { label: string; color: string } {
  if (ms < 200) return { label: "Superhuman", color: "text-yellow-300" };
  if (ms < 250) return { label: "Excellent", color: "text-green-300" };
  if (ms < 300) return { label: "Good", color: "text-emerald-400" };
  if (ms < 400) return { label: "Average", color: "text-blue-300" };
  return { label: "Keep trying", color: "text-zinc-400" };
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rounds, setRounds] = useState<number[]>([]);
  const [lastReaction, setLastReaction] = useState<number | null>(null);

  const greenTimestampRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScheduledTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearScheduledTimeout();
  }, [clearScheduledTimeout]);

  const startRound = useCallback(() => {
    setPhase("waiting");
    greenTimestampRef.current = null;

    const delay = Math.random() * 3000 + 1000;
    timeoutRef.current = setTimeout(() => {
      greenTimestampRef.current = performance.now();
      setPhase("ready");
    }, delay);
  }, []);

  const handleTap = useCallback(() => {
    if (phase === "idle") {
      startRound();
      return;
    }

    if (phase === "waiting") {
      clearScheduledTimeout();
      setPhase("too-early");
      return;
    }

    if (phase === "ready") {
      const now = performance.now();
      const reactionTime = Math.round(now - (greenTimestampRef.current ?? now));
      setLastReaction(reactionTime);

      const newRounds = [...rounds, reactionTime];
      setRounds(newRounds);

      if (newRounds.length >= TOTAL_ROUNDS) {
        setPhase("summary");
      } else {
        setPhase("result");
      }
      return;
    }

    if (phase === "result") {
      startRound();
      return;
    }

    if (phase === "too-early") {
      startRound();
      return;
    }
  }, [phase, rounds, startRound, clearScheduledTimeout]);

  const playAgain = useCallback(() => {
    setRounds([]);
    setLastReaction(null);
    setPhase("idle");
  }, []);

  const bgColor =
    phase === "waiting"
      ? "var(--game-red)"
      : phase === "ready"
        ? "var(--game-green)"
        : "var(--game-dark)";

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: full-screen game tap target — keyboard not applicable for reaction game
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden game-screen"
      style={{ backgroundColor: bgColor }}
      onClick={handleTap}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTap();
      }}
      data-ocid="reaction.canvas_target"
      aria-label="Reaction time test game area"
      role="application"
    >
      <AnimatePresence mode="wait">
        {phase === "idle" && <IdleScreen key="idle" onStart={handleTap} />}
        {phase === "waiting" && <WaitingScreen key="waiting" />}
        {phase === "ready" && <ReadyScreen key="ready" />}
        {phase === "too-early" && <TooEarlyScreen key="too-early" />}
        {phase === "result" && lastReaction !== null && (
          <ResultScreen
            key="result"
            reactionTime={lastReaction}
            roundNumber={rounds.length}
            totalRounds={TOTAL_ROUNDS}
            rounds={rounds}
          />
        )}
        {phase === "summary" && (
          <SummaryScreen
            key="summary"
            rounds={rounds}
            onPlayAgain={playAgain}
          />
        )}
      </AnimatePresence>

      {/* Round progress dots — shown during active game phases */}
      {(phase === "waiting" ||
        phase === "ready" ||
        phase === "result" ||
        phase === "too-early") && (
        <RoundDots completed={rounds.length} total={TOTAL_ROUNDS} />
      )}

      {/* Footer */}
      {phase === "idle" && (
        <footer className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs" style={{ color: "oklch(0.45 0.01 270)" }}>
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: "oklch(0.55 0.015 270)" }}
              onClick={(e) => e.stopPropagation()}
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      )}
    </div>
  );
}

/* ─── Sub-screens ─────────────────────────────────────────── */

function IdleScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-10 px-8 text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Icon / logo */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-24 h-24 rounded-full blur-2xl opacity-30"
          style={{ backgroundColor: "oklch(0.65 0.22 145)" }}
        />
        <div
          className="relative w-16 h-16 rounded-full flex items-center justify-center border-2"
          style={{
            borderColor: "oklch(0.65 0.22 145 / 0.6)",
            backgroundColor: "oklch(0.17 0.008 270)",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="oklch(0.65 0.22 145)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1
          className="text-4xl font-bold tracking-tight leading-none mb-2"
          style={{ color: "oklch(0.96 0.01 270)" }}
        >
          Reaction
          <br />
          Time Test
        </h1>
        <p
          className="text-sm font-medium mt-3"
          style={{ color: "oklch(0.58 0.015 270)" }}
        >
          How fast are your reflexes?
        </p>
      </div>

      {/* Instructions */}
      <div
        className="w-full max-w-xs rounded-2xl p-5 space-y-3 border"
        style={{
          backgroundColor: "oklch(0.17 0.008 270)",
          borderColor: "oklch(0.28 0.01 270)",
        }}
      >
        <Instruction
          step="1"
          text="Screen turns red — wait patiently"
          color="oklch(0.55 0.18 25)"
        />
        <Instruction
          step="2"
          text="Screen turns green — tap immediately!"
          color="oklch(0.55 0.22 145)"
        />
        <Instruction
          step="3"
          text="Complete 5 rounds to see your score"
          color="oklch(0.65 0.15 270)"
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        className="relative w-full max-w-xs h-14 rounded-2xl font-bold text-lg tracking-wide transition-transform active:scale-95"
        style={{
          backgroundColor: "oklch(0.65 0.22 145)",
          color: "oklch(0.1 0.005 270)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        data-ocid="reaction.start_button"
        aria-label="Tap to start the game"
      >
        Tap to Start
      </button>
    </motion.div>
  );
}

function Instruction({
  step,
  text,
  color,
}: {
  step: string;
  text: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          color,
          background: `color-mix(in oklch, ${color} 18%, transparent)`,
        }}
      >
        {step}
      </span>
      <span
        className="text-sm leading-snug pt-0.5"
        style={{ color: "oklch(0.72 0.012 270)" }}
      >
        {text}
      </span>
    </div>
  );
}

function WaitingScreen() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="w-20 h-20 rounded-full border-4 border-white/20"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 1.6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <p
        className="text-xl font-semibold tracking-wide"
        style={{ color: "oklch(0.92 0.02 25)" }}
      >
        Wait for green...
      </p>
      <p className="text-sm" style={{ color: "oklch(0.75 0.05 25)" }}>
        Don&#39;t tap yet!
      </p>
    </motion.div>
  );
}

function ReadyScreen() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.08 }}
    >
      <motion.p
        className="text-5xl font-black tracking-tight"
        style={{ color: "oklch(0.97 0.02 145)" }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{
          duration: 0.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        TAP NOW!
      </motion.p>
      <p
        className="text-lg font-medium"
        style={{ color: "oklch(0.85 0.06 145)" }}
      >
        Tap anywhere on screen
      </p>
    </motion.div>
  );
}

function TooEarlyScreen() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 text-center px-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        style={{
          background:
            "color-mix(in oklch, oklch(0.55 0.22 25) 20%, transparent)",
        }}
      >
        ⚡
      </div>
      <div>
        <p
          className="text-2xl font-bold"
          style={{ color: "oklch(0.9 0.04 25)" }}
        >
          Too early!
        </p>
        <p className="text-sm mt-1" style={{ color: "oklch(0.65 0.02 270)" }}>
          Tap to try this round again
        </p>
      </div>
    </motion.div>
  );
}

function ResultScreen({
  reactionTime,
  roundNumber,
  totalRounds,
  rounds,
}: {
  reactionTime: number;
  roundNumber: number;
  totalRounds: number;
  rounds: number[];
}) {
  const rating = getRating(reactionTime);

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 px-8 text-center"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      data-ocid="reaction.result_card"
    >
      {/* Round indicator */}
      <p
        className="text-sm font-medium tracking-widest uppercase"
        style={{ color: "oklch(0.55 0.015 270)" }}
        data-ocid="reaction.round_indicator"
      >
        Round {roundNumber} / {totalRounds}
      </p>

      {/* Big number */}
      <div className="number-pop">
        <div className="flex items-end justify-center gap-2">
          <span
            className="font-black leading-none"
            style={{
              fontSize: "clamp(72px, 20vw, 96px)",
              color: "oklch(0.96 0.01 270)",
              letterSpacing: "-0.03em",
            }}
          >
            {reactionTime}
          </span>
          <span
            className="font-semibold mb-3 text-2xl"
            style={{ color: "oklch(0.5 0.015 270)" }}
          >
            ms
          </span>
        </div>
        <p className={`text-base font-semibold ${rating.color}`}>
          {rating.label}
        </p>
      </div>

      {/* Mini history */}
      {rounds.length > 1 && (
        <div
          className="flex gap-2 items-center text-sm"
          style={{ color: "oklch(0.5 0.01 270)" }}
        >
          <span>Best so far:</span>
          <span className="font-bold" style={{ color: "oklch(0.78 0.12 145)" }}>
            {getBest(rounds)} ms
          </span>
        </div>
      )}

      {/* Tap to continue hint */}
      <motion.p
        className="text-sm font-medium"
        style={{ color: "oklch(0.45 0.01 270)" }}
        animate={{ opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        Tap anywhere for next round →
      </motion.p>
    </motion.div>
  );
}

function SummaryScreen({
  rounds,
  onPlayAgain,
}: {
  rounds: number[];
  onPlayAgain: () => void;
}) {
  const avg = getAverage(rounds);
  const best = getBest(rounds);
  const rating = getRating(best);

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 px-6 text-center w-full max-w-sm"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      data-ocid="reaction.summary_card"
    >
      <div>
        <p
          className="text-sm font-semibold tracking-widest uppercase mb-1"
          style={{ color: "oklch(0.55 0.015 270)" }}
        >
          Final Results
        </p>
        <h2
          className="text-3xl font-black"
          style={{ color: "oklch(0.96 0.01 270)" }}
        >
          All 5 rounds done!
        </h2>
      </div>

      {/* Stats row */}
      <div className="flex w-full gap-3">
        <StatCard label="Best" value={best} unit="ms" highlight />
        <StatCard label="Average" value={avg} unit="ms" />
      </div>

      {/* Round breakdown */}
      <div
        className="w-full rounded-2xl overflow-hidden border"
        style={{
          backgroundColor: "oklch(0.17 0.008 270)",
          borderColor: "oklch(0.28 0.01 270)",
        }}
      >
        {rounds.map((time, i) => (
          <RoundRow
            // biome-ignore lint/suspicious/noArrayIndexKey: stable ordered list
            key={i}
            index={i + 1}
            time={time}
            isBest={time === best}
            isLast={i === rounds.length - 1}
          />
        ))}
      </div>

      {/* Rating */}
      <div
        className="w-full rounded-xl py-3 px-4 text-center"
        style={{ backgroundColor: "oklch(0.17 0.008 270)" }}
      >
        <span className="text-sm" style={{ color: "oklch(0.5 0.01 270)" }}>
          Your rating:{" "}
        </span>
        <span className={`text-sm font-bold ${rating.color}`}>
          {rating.label}
        </span>
      </div>

      {/* Play again */}
      <button
        type="button"
        className="w-full h-14 rounded-2xl font-bold text-lg tracking-wide transition-transform active:scale-95"
        style={{
          backgroundColor: "oklch(0.65 0.22 145)",
          color: "oklch(0.1 0.005 270)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPlayAgain();
        }}
        data-ocid="reaction.play_again_button"
        aria-label="Play again"
      >
        Play Again
      </button>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex-1 rounded-2xl p-4 text-center border"
      style={{
        backgroundColor: highlight
          ? "color-mix(in oklch, oklch(0.55 0.22 145) 12%, oklch(0.17 0.008 270))"
          : "oklch(0.17 0.008 270)",
        borderColor: highlight
          ? "color-mix(in oklch, oklch(0.55 0.2 145) 35%, transparent)"
          : "oklch(0.28 0.01 270)",
      }}
    >
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-1"
        style={{
          color: highlight ? "oklch(0.65 0.18 145)" : "oklch(0.5 0.01 270)",
        }}
      >
        {label}
      </p>
      <div className="flex items-end justify-center gap-1">
        <span
          className="text-3xl font-black leading-none"
          style={{
            color: highlight ? "oklch(0.85 0.18 145)" : "oklch(0.9 0.01 270)",
          }}
        >
          {value}
        </span>
        <span
          className="text-sm font-medium mb-0.5"
          style={{ color: "oklch(0.48 0.01 270)" }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function RoundRow({
  index,
  time,
  isBest,
  isLast,
}: {
  index: number;
  time: number;
  isBest: boolean;
  isLast: boolean;
}) {
  const rating = getRating(time);
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${!isLast ? "border-b" : ""}`}
      style={{ borderColor: "oklch(0.25 0.01 270)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: "oklch(0.22 0.01 270)",
            color: "oklch(0.55 0.015 270)",
          }}
        >
          {index}
        </span>
        <span
          className="text-sm font-medium"
          style={{ color: "oklch(0.65 0.01 270)" }}
        >
          Round {index}
        </span>
        {isBest && (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background:
                "color-mix(in oklch, oklch(0.55 0.22 145) 15%, transparent)",
              color: "oklch(0.65 0.2 145)",
            }}
          >
            Best
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="font-bold text-base"
          style={{ color: "oklch(0.9 0.01 270)" }}
        >
          {time}
          <span
            className="text-xs font-normal ml-0.5"
            style={{ color: "oklch(0.5 0.01 270)" }}
          >
            ms
          </span>
        </span>
        <span className={`text-xs font-medium ${rating.color}`}>
          {rating.label}
        </span>
      </div>
    </div>
  );
}

function RoundDots({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional indicators
          key={i}
          className="rounded-full"
          style={{
            width: i < completed ? 20 : 8,
            height: 8,
            backgroundColor:
              i < completed ? "oklch(0.65 0.22 145)" : "oklch(0.35 0.01 270)",
          }}
          animate={{
            width: i < completed ? 20 : 8,
            backgroundColor:
              i < completed ? "oklch(0.65 0.22 145)" : "oklch(0.35 0.01 270)",
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

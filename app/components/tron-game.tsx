import { useRef, useEffect, useState, useCallback } from "react";

const GRID = 20;
const CELL = 10;
const SIZE = GRID * CELL;
const TICK_MS = 110;

type Dir = { x: number; y: number };
const UP: Dir = { x: 0, y: -1 };
const DOWN: Dir = { x: 0, y: 1 };
const LEFT: Dir = { x: -1, y: 0 };
const RIGHT: Dir = { x: 1, y: 0 };

function opposite(a: Dir, b: Dir) {
  return a.x === -b.x && a.y === -b.y;
}

function inBounds(x: number, y: number) {
  return x >= 0 && x < GRID && y >= 0 && y < GRID;
}

type Cell = { x: number; y: number };

interface GameState {
  player: Cell;
  playerDir: Dir;
  playerNextDir: Dir;
  playerTrail: Set<string>;
  ai: Cell;
  aiDir: Dir;
  aiTrail: Set<string>;
}

function key(x: number, y: number) {
  return `${x},${y}`;
}

function isSafe(x: number, y: number, state: GameState) {
  if (!inBounds(x, y)) return false;
  const k = key(x, y);
  return !state.playerTrail.has(k) && !state.aiTrail.has(k);
}

function chooseAiDir(state: GameState): Dir {
  const { ai, aiDir } = state;
  const candidates = [aiDir, LEFT, RIGHT, UP, DOWN];
  for (const dir of candidates) {
    if (opposite(dir, aiDir)) continue;
    const nx = ai.x + dir.x;
    const ny = ai.y + dir.y;
    if (isSafe(nx, ny, state)) return dir;
  }
  return aiDir;
}

function initGame(): GameState {
  const player = { x: 4, y: GRID / 2 };
  const ai = { x: GRID - 5, y: GRID / 2 };
  return {
    player,
    playerDir: RIGHT,
    playerNextDir: RIGHT,
    playerTrail: new Set([key(player.x, player.y)]),
    ai,
    aiDir: LEFT,
    aiTrail: new Set([key(ai.x, ai.y)]),
  };
}

function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  status: "idle" | "playing" | "over",
  winner: "player" | "ai" | null
) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, SIZE, SIZE);

  // faint grid
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(SIZE, i * CELL);
    ctx.stroke();
  }

  // player trail
  ctx.fillStyle = "#0ff8";
  for (const k of state.playerTrail) {
    const [x, y] = k.split(",").map(Number);
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }
  // player head
  ctx.fillStyle = "#0ff";
  ctx.fillRect(
    state.player.x * CELL,
    state.player.y * CELL,
    CELL,
    CELL
  );

  // ai trail
  ctx.fillStyle = "#f808";
  for (const k of state.aiTrail) {
    const [x, y] = k.split(",").map(Number);
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }
  // ai head
  ctx.fillStyle = "#f80";
  ctx.fillRect(state.ai.x * CELL, state.ai.y * CELL, CELL, CELL);

  if (status === "idle") {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#0ff";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("TRON", SIZE / 2, SIZE / 2 - 14);
    ctx.fillStyle = "#fff";
    ctx.font = "9px monospace";
    ctx.fillText("WASD / arrows to move", SIZE / 2, SIZE / 2 + 2);
    ctx.fillText("Press any key to start", SIZE / 2, SIZE / 2 + 16);
  }

  if (status === "over") {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    if (winner === "player") {
      ctx.fillStyle = "#0ff";
      ctx.fillText("YOU WIN!", SIZE / 2, SIZE / 2 - 10);
    } else {
      ctx.fillStyle = "#f80";
      ctx.fillText("YOU LOSE", SIZE / 2, SIZE / 2 - 10);
    }
    ctx.fillStyle = "#aaa";
    ctx.font = "9px monospace";
    ctx.fillText("R or click Restart", SIZE / 2, SIZE / 2 + 8);
  }
}

export function TronGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initGame());
  const statusRef = useRef<"idle" | "playing" | "over">("idle");
  const winnerRef = useRef<"player" | "ai" | null>(null);
  const [score, setScore] = useState({ wins: 0, losses: 0 });
  const [tick, setTick] = useState(0);

  function forceRender() {
    setTick((n) => n + 1);
  }

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGame(ctx, stateRef.current, statusRef.current, winnerRef.current);
  }, []);

  const restart = useCallback(() => {
    stateRef.current = initGame();
    statusRef.current = "idle";
    winnerRef.current = null;
    forceRender();
    render();
  }, [render]);

  // game loop
  useEffect(() => {
    render();
    if (statusRef.current !== "playing") return;

    const id = setInterval(() => {
      if (statusRef.current !== "playing") return;
      const s = stateRef.current;

      // apply queued direction
      s.playerDir = s.playerNextDir;

      // move player
      const px = s.player.x + s.playerDir.x;
      const py = s.player.y + s.playerDir.y;

      // pick ai direction
      s.aiDir = chooseAiDir(s);
      const ax = s.ai.x + s.aiDir.x;
      const ay = s.ai.y + s.aiDir.y;

      const playerHit =
        !inBounds(px, py) ||
        s.playerTrail.has(key(px, py)) ||
        s.aiTrail.has(key(px, py));
      const aiHit =
        !inBounds(ax, ay) ||
        s.aiTrail.has(key(ax, ay)) ||
        s.playerTrail.has(key(ax, ay));

      if (playerHit || aiHit) {
        let winner: "player" | "ai";
        if (playerHit && aiHit) winner = Math.random() < 0.5 ? "player" : "ai";
        else if (playerHit) winner = "ai";
        else winner = "player";

        statusRef.current = "over";
        winnerRef.current = winner;
        setScore((sc) =>
          winner === "player"
            ? { ...sc, wins: sc.wins + 1 }
            : { ...sc, losses: sc.losses + 1 }
        );
        render();
        return;
      }

      s.player = { x: px, y: py };
      s.playerTrail.add(key(px, py));
      s.ai = { x: ax, y: ay };
      s.aiTrail.add(key(ax, ay));

      render();
    }, TICK_MS);

    return () => clearInterval(id);
  }, [tick, render]); // re-run loop when tick changes (status transitions)

  // keyboard handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = stateRef.current;

      if (
        statusRef.current === "idle" &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)
      ) {
        statusRef.current = "playing";
        forceRender();
      }

      if (e.key === "r" || e.key === "R") {
        restart();
        return;
      }

      if (statusRef.current !== "playing") return;

      const dirMap: Record<string, Dir> = {
        ArrowUp: UP,
        ArrowDown: DOWN,
        ArrowLeft: LEFT,
        ArrowRight: RIGHT,
        w: UP,
        s: DOWN,
        a: LEFT,
        d: RIGHT,
      };
      const newDir = dirMap[e.key];
      if (newDir && !opposite(newDir, s.playerDir)) {
        s.playerNextDir = newDir;
        e.preventDefault();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [restart]);

  // initial render
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex w-full justify-between px-1 text-xs font-mono">
        <span className="text-cyan-400">YOU {score.wins}W</span>
        <span className="text-orange-400">AI {score.losses}W</span>
      </div>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="rounded border border-sidebar-border"
        style={{ imageRendering: "pixelated" }}
        onClick={() => {
          if (statusRef.current === "idle") {
            statusRef.current = "playing";
            forceRender();
          }
        }}
      />
      <div className="flex w-full justify-between items-center px-1">
        <span className="text-xs text-sidebar-foreground/40">WASD / arrows</span>
        <button
          onClick={restart}
          className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors font-mono"
        >
          [R]estart
        </button>
      </div>
    </div>
  );
}

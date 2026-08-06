#!/usr/bin/env bash
# Revenue Nexus AI — one command to run everything locally.
#
#   ./start.sh          install if needed, run the gate, start the app
#   ./start.sh --skip   skip the tests and just start
#
set -e
cd "$(dirname "$0")/demo"

BOLD=$'\033[1m'; DIM=$'\033[2m'; GRN=$'\033[32m'; RED=$'\033[31m'; RST=$'\033[0m'

echo ""
echo "${BOLD}Revenue Nexus AI${RST} ${DIM}— founder demo${RST}"
echo "${DIM}────────────────────────────────────────────────${RST}"

# 1 · Node present?
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "${RED}Node.js is not installed.${RST} ${DIM}(one-time setup, about 3 minutes)${RST}"
  echo ""
  if command -v brew >/dev/null 2>&1; then
    echo "  You have Homebrew, so the quickest route is:"
    echo ""
    echo "      ${BOLD}brew install node${RST}"
    echo ""
  else
    echo "  Download the macOS installer (LTS) from:"
    echo ""
    echo "      ${BOLD}https://nodejs.org${RST}"
    echo ""
    echo "  Open the .pkg, click through, done."
    echo ""
  fi
  echo "  ${BOLD}Then close this terminal and open a new one${RST} — the PATH"
  echo "  will not refresh in this window — and run ./start.sh again."
  echo ""
  exit 1
fi
echo "  node        $(node --version)"

# 2 · Dependencies — including a check that they were built for THIS platform.
# node_modules can be copied between machines, but esbuild and Next ship
# platform-specific native binaries. A Linux install will not run on macOS.
#
# Check for the BINARY FILE, not the directory. A directory can exist and be
# empty — which is exactly what happens when node_modules is copied between
# machines or across a mounted filesystem. Checking `-d` gives a false pass.
case "$(uname -s)-$(uname -m)" in
  Darwin-arm64)  NEEDED="node_modules/@esbuild/darwin-arm64/bin/esbuild" ;;
  Darwin-x86_64) NEEDED="node_modules/@esbuild/darwin-x64/bin/esbuild"   ;;
  Linux-x86_64)  NEEDED="node_modules/@esbuild/linux-x64/bin/esbuild"    ;;
  Linux-aarch64) NEEDED="node_modules/@esbuild/linux-arm64/bin/esbuild"  ;;
  *)             NEEDED=""                                                ;;
esac

REINSTALL=0
if [ ! -d node_modules ] || [ ! -d node_modules/next ]; then
  REINSTALL=1
  REASON="first run"
elif [ -n "$NEEDED" ] && [ ! -f "$NEEDED" ]; then
  REINSTALL=1
  REASON="native binaries missing or built for another platform"
fi

if [ "$REINSTALL" = "1" ]; then
  echo "  deps        ${DIM}installing — ${REASON} (~2 min)…${RST}"
  rm -rf node_modules
  npm install --no-audit --no-fund --silent
  echo "  deps        ${GRN}installed${RST}"
else
  echo "  deps        ok"
fi

# 3 · The gate
#
# Distinguish "tests ran and failed" from "tests could not run at all".
# Conflating those produces a terrifying and false message about the
# arithmetic being wrong when the real problem is a broken toolchain.
if [ "$1" != "--skip" ]; then
  echo "  tests       ${DIM}running 35 golden assertions…${RST}"
  set +e
  npx tsx tests/engine.spec.ts > /tmp/rn-test.log 2>&1
  TEST_EXIT=$?
  set -e

  if [ "$TEST_EXIT" = "0" ]; then
    echo "  tests       ${GRN}35/35 passed${RST} ${DIM}— engine matches the Python spike${RST}"
  elif grep -q "passed," /tmp/rn-test.log; then
    # The suite executed and reported real failures.
    echo "  tests       ${RED}FAILED — the arithmetic is wrong${RST}"
    echo ""
    grep -E "✗|passed," /tmp/rn-test.log | head -20
    echo ""
    echo "${RED}Not starting the app. Fix the engine before looking at screens.${RST}"
    echo "${DIM}Full log: /tmp/rn-test.log${RST}"
    exit 1
  else
    # The runner itself crashed. This says nothing about the arithmetic.
    echo "  tests       ${RED}could not run${RST} ${DIM}— toolchain problem, not a maths problem${RST}"
    echo ""
    tail -12 /tmp/rn-test.log
    echo ""
    echo "  Most likely fix:"
    echo ""
    echo "      ${BOLD}cd demo && rm -rf node_modules && npm install${RST}"
    echo ""
    echo "  ${DIM}Or run ./start.sh --skip to start the app without the tests.${RST}"
    echo "  ${DIM}Full log: /tmp/rn-test.log${RST}"
    exit 1
  fi
fi

# 4 · Live AI?
if [ -f .env.local ] && grep -q "ANTHROPIC_API_KEY=sk-" .env.local 2>/dev/null; then
  echo "  ai          ${GRN}live${RST} ${DIM}(claude-sonnet-5)${RST}"
else
  echo "  ai          ${DIM}pre-computed answers — add ANTHROPIC_API_KEY to demo/.env.local for live${RST}"
fi

# 5 · Pick a free port BEFORE printing the banner, so the URL is never a lie.
# Next.js silently falls forward when 3000 is taken; if we print first, we
# send you to the wrong address.
PORT=$(node -e '
const net = require("net");
const free = p => new Promise(r => {
  const s = net.createServer();
  s.once("error", () => r(false));
  s.once("listening", () => s.close(() => r(true)));
  s.listen(p, "127.0.0.1");
});
(async () => {
  for (let p = 3000; p < 3030; p++) if (await free(p)) return console.log(p);
  console.log(3000);
})();
')

# 6 · Local network address, for testing on a phone
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null \
     || hostname -I 2>/dev/null | awk '{print $1}' || echo "")

echo "${DIM}────────────────────────────────────────────────${RST}"
echo ""
echo "  ${BOLD}On this computer${RST}   ${GRN}http://localhost:$PORT${RST}"
[ -n "$IP" ] && echo "  ${BOLD}On your phone${RST}      ${GRN}http://$IP:$PORT${RST}   ${DIM}(same wifi)${RST}"
[ "$PORT" != "3000" ] && echo "  ${DIM}                     port 3000 was busy, using $PORT${RST}"
echo ""
echo "  ${DIM}Walk it in order:  /  →  /demo/contract  →  /demo/billing${RST}"
echo "  ${DIM}                      →  /demo/explain   →  /demo/lineage${RST}"
echo ""
echo "  ${DIM}Ctrl+C to stop${RST}"
echo ""

npm run dev -- -p "$PORT"

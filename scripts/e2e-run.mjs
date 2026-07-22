import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const fixturePath = path.join(process.cwd(), ".e2e", "fixtures.json");

if (!fs.existsSync(fixturePath)) {
  console.error("Faltan fixtures E2E. Ejecuta primero test:e2e:prepare.");
  process.exit(1);
}

const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const executable = process.execPath;
const args = [
  path.join(process.cwd(), "node_modules", "@playwright", "test", "cli.js"),
  "test",
  ...process.argv.slice(2),
];

console.log(`Playwright: ${args.slice(1).join(" ")}`);

const child = spawn(executable, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    ADMIN_OWNER_USER_ID: fixtures.ownerOverrideId,
    AGENDAME_E2E: "1",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Playwright terminó por señal ${signal}.`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

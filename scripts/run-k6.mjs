import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [, , script, ...extraArgs] = process.argv;

if (!script) {
  console.error("Falta la ruta del escenario k6.");
  process.exit(1);
}

const executable = process.env.K6_BIN || "k6";
const k6Args = [...extraArgs];

if (
  process.env.K6_SUMMARY_EXPORT &&
  !k6Args.some(
    (argument) =>
      argument === "--summary-export" || argument.startsWith("--summary-export=")
  )
) {
  k6Args.unshift(`--summary-export=${process.env.K6_SUMMARY_EXPORT}`);
}

const summaryFlagIndex = k6Args.findIndex(
  (argument) =>
    argument === "--summary-export" || argument.startsWith("--summary-export=")
);

if (summaryFlagIndex >= 0) {
  const argument = k6Args[summaryFlagIndex];
  const summaryPath = argument.includes("=")
    ? argument.slice(argument.indexOf("=") + 1)
    : k6Args[summaryFlagIndex + 1];

  if (summaryPath) {
    fs.mkdirSync(path.dirname(path.resolve(summaryPath)), { recursive: true });
  }
}

const child = spawn(executable, ["run", ...k6Args, script], {
  stdio: "inherit",
  env: process.env,
  shell: false,
});

child.on("error", (error) => {
  if (error.code === "ENOENT") {
    console.error(
      "No se encontro k6. Instalalo o define K6_BIN con la ruta completa a k6.exe."
    );
  } else {
    console.error(error.message);
  }
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`k6 termino por la senal ${signal}.`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});

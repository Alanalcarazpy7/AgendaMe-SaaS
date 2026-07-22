import fs from "node:fs";
import path from "node:path";

type E2EAccount = {
  id: string;
  email: string;
  password: string;
  storage: string;
};

type E2EBusiness = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  principalBranch: { id: string; nombre: string };
  secondaryBranch?: { id: string; nombre: string };
  service: { id: string; nombre: string };
  employee: { id: string; nombre: string };
  secondaryEmployee?: { id: string; nombre: string };
};

export type E2EFixtures = {
  generatedAt: string;
  ownerOverrideId: string;
  accounts: Record<string, E2EAccount>;
  businesses: Record<string, E2EBusiness>;
  plans: Record<string, Record<string, unknown>>;
};

export function loadE2EFixtures(): E2EFixtures {
  const fixturePath = path.join(process.cwd(), ".e2e", "fixtures.json");
  if (!fs.existsSync(fixturePath)) {
    throw new Error("Faltan .e2e/fixtures.json. Ejecuta npm run test:e2e:prepare.");
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as E2EFixtures;
}

export function hasE2EFixtures() {
  return fs.existsSync(path.join(process.cwd(), ".e2e", "fixtures.json"));
}

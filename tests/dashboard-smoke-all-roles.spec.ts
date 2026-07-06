import { test } from "@playwright/test";
import {
  AGENDA,
  RUTAS_ADMIN,
  RUTAS_GERENTE,
  RUTAS_RECEPCION,
  RUTAS_EMPLEADO,
  esperarDashboardValido,
} from "./helpers/agendame";

const roles = [
  {
    nombre: "admin",
    storage: AGENDA.adminStorage,
    rutas: RUTAS_ADMIN,
  },
  {
    nombre: "gerente",
    storage: AGENDA.gerenteStorage,
    rutas: RUTAS_GERENTE,
  },
  {
    nombre: "recepcion",
    storage: AGENDA.recepcionStorage,
    rutas: RUTAS_RECEPCION,
  },
  {
    nombre: "empleado",
    storage: AGENDA.empleadoStorage,
    rutas: RUTAS_EMPLEADO,
  },
];

for (const rol of roles) {
  test.describe(`smoke dashboard ${rol.nombre}`, () => {
    test.use({ storageState: rol.storage });

    for (const ruta of rol.rutas) {
      test(`${rol.nombre} carga sin errores ${ruta}`, async ({ page }) => {
        await page.goto(ruta, { waitUntil: "domcontentloaded" });

        await esperarDashboardValido(page);

        console.log(`${rol.nombre} OK: ${ruta}`);
      });
    }
  });
}
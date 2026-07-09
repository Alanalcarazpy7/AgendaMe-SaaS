import { CheckCircle2, Minus } from "lucide-react";
import { nivelPlan } from "@/lib/planes/plan-access";
import { formatLimit, type PlanPublico } from "@/lib/planes/planes-shared";

type PlanComparisonTableProps = {
  planes: PlanPublico[];
};

type CeldaValor = string | boolean;

type FilaComparativa = {
  label: string;
  valor: (plan: PlanPublico) => CeldaValor;
};

const FILAS: FilaComparativa[] = [
  {
    label: "Citas mensuales",
    valor: (plan) => formatLimit(plan.limite_citas_mensuales, "cita mensual", "citas mensuales"),
  },
  {
    label: "Empleados",
    valor: (plan) => formatLimit(plan.limite_empleados, "empleado", "empleados"),
  },
  {
    label: "Servicios",
    valor: (plan) => formatLimit(plan.limite_servicios, "servicio", "servicios"),
  },
  {
    label: "Clientes",
    valor: (plan) => formatLimit(plan.limite_clientes, "cliente", "clientes"),
  },
  {
    label: "Sucursales",
    valor: (plan) => formatLimit(plan.limite_sucursales, "sucursal", "sucursales"),
  },
  { label: "Página pública de reservas", valor: () => true },
  { label: "Gestión de clientes", valor: () => true },
  { label: "Gestión de empleados", valor: () => true },
  { label: "Gestión de servicios", valor: () => true },
  { label: "Estadísticas básicas", valor: (plan) => nivelPlan(plan.clave) >= 1 },
  { label: "Reportes avanzados", valor: (plan) => !!plan.permite_reportes_avanzados },
  { label: "Exportación XLSX / CSV", valor: (plan) => !!plan.permite_exportacion_csv },
  { label: "Recordatorios WhatsApp", valor: (plan) => nivelPlan(plan.clave) >= 2 },
  { label: "Múltiples sucursales", valor: (plan) => !!plan.permite_multiples_sucursales },
  { label: "Soporte prioritario", valor: (plan) => nivelPlan(plan.clave) >= 2 },
  {
    label: "Funcionalidades a medida bajo evaluación",
    valor: (plan) => plan.clave === "empresarial",
  },
];

function Celda({ valor }: { valor: CeldaValor }) {
  if (typeof valor === "string") {
    return <span className="text-sm font-medium">{valor}</span>;
  }

  return valor ? (
    <CheckCircle2 className="mx-auto h-5 w-5 text-chart-4" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />
  );
}

export function PlanComparisonTable({ planes }: PlanComparisonTableProps) {
  if (planes.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-3xl border bg-background shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="p-4 text-sm font-semibold text-muted-foreground">
              Comparativa
            </th>
            {planes.map((plan) => (
              <th
                key={plan.id}
                className={`p-4 text-center text-sm font-bold ${
                  plan.destacado ? "bg-primary/8 text-primary" : ""
                }`}
              >
                {plan.nombre}
                {plan.destacado && (
                  <span className="mx-auto mt-1 block w-fit rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    Recomendado
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {FILAS.map((fila, index) => (
            <tr
              key={fila.label}
              className={`border-b transition-colors duration-150 last:border-0 hover:bg-muted/30 ${
                index % 2 === 1 ? "bg-muted/10" : ""
              }`}
            >
              <td className="p-4 text-sm font-medium">{fila.label}</td>
              {planes.map((plan) => (
                <td
                  key={plan.id}
                  className={`p-4 text-center ${plan.destacado ? "bg-primary/4" : ""}`}
                >
                  <Celda valor={fila.valor(plan)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


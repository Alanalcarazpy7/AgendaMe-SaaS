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
  { label: "Pagina publica de reservas", valor: () => true },
  { label: "Gestion de clientes", valor: () => true },
  { label: "Gestion de empleados", valor: () => true },
  { label: "Gestion de servicios", valor: () => true },
  { label: "Estadisticas basicas", valor: (plan) => nivelPlan(plan.clave) >= 1 },
  { label: "Reportes avanzados", valor: (plan) => !!plan.permite_reportes_avanzados },
  { label: "Exportacion XLSX / CSV", valor: (plan) => !!plan.permite_exportacion_csv },
  { label: "Recordatorios WhatsApp", valor: (plan) => nivelPlan(plan.clave) >= 2 },
  { label: "Multiples sucursales", valor: (plan) => !!plan.permite_multiples_sucursales },
  { label: "Soporte prioritario", valor: (plan) => nivelPlan(plan.clave) >= 2 },
  {
    label: "Funcionalidades a medida bajo evaluacion",
    valor: (plan) => plan.clave === "empresarial",
  },
];

function Celda({ valor }: { valor: CeldaValor }) {
  if (typeof valor === "string") {
    return <span className="text-sm">{valor}</span>;
  }

  return valor ? (
    <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-muted-foreground" />
  );
}

export function PlanComparisonTable({ planes }: PlanComparisonTableProps) {
  if (planes.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-3xl border bg-background shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="p-4 text-sm font-semibold text-muted-foreground">
              Comparativa
            </th>
            {planes.map((plan) => (
              <th key={plan.id} className="p-4 text-center text-sm font-bold">
                {plan.nombre}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {FILAS.map((fila) => (
            <tr key={fila.label} className="border-b last:border-0">
              <td className="p-4 text-sm font-medium">{fila.label}</td>
              {planes.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
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


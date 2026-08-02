import { CheckCircle2, Minus } from "lucide-react";
import {
  formatLimit,
  planPermite,
  type PlanPublico,
} from "@/lib/planes/planes-shared";

type PlanComparisonTableProps = {
  planes: PlanPublico[];
};

type CeldaValor = string | boolean;

type FilaComparativa = {
  label: string;
  valor: (plan: PlanPublico) => CeldaValor;
};

type GrupoComparativo = {
  titulo: string;
  descripcion: string;
  filas: FilaComparativa[];
};

const GRUPOS: GrupoComparativo[] = [
  {
    titulo: "Capacidad",
    descripcion: "Límites activos por negocio",
    filas: [
      {
        label: "Citas mensuales",
        valor: (plan) =>
          formatLimit(plan.limite_citas_mensuales, "cita mensual", "citas mensuales"),
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
    ],
  },
  {
    titulo: "Agenda y reservas",
    descripcion: "Operación diaria incluida",
    filas: [
      { label: "Link público de reservas 24/7", valor: () => true },
      { label: "Calendario detallado y compacto", valor: () => true },
      { label: "Gestión de estados de cada cita", valor: () => true },
      { label: "Horarios y disponibilidad online", valor: () => true },
      { label: "Actualización automática de reservas", valor: () => true },
    ],
  },
  {
    titulo: "Gestión del negocio",
    descripcion: "Clientes, equipo y catálogo",
    filas: [
      { label: "Clientes e historial de reservas", valor: () => true },
      { label: "Gestión de empleados", valor: () => true },
      { label: "Horarios por empleado", valor: () => true },
      { label: "Servicios con imágenes", valor: () => true },
      {
        label: "Logo y banner del negocio",
        valor: (plan) => planPermite(plan, "permite_personalizacion"),
      },
    ],
  },
  {
    titulo: "Análisis y seguimiento",
    descripcion: "Herramientas para tomar decisiones",
    filas: [
      {
        label: "Reportes básicos de citas e ingresos",
        valor: (plan) => planPermite(plan, "permite_reportes_basicos"),
      },
      {
        label: "Reportes avanzados y tendencias",
        valor: (plan) => planPermite(plan, "permite_reportes_avanzados"),
      },
      {
        label: "Rankings de servicios, clientes y equipo",
        valor: (plan) => planPermite(plan, "permite_reportes_avanzados"),
      },
      {
        label: "Exportación XLSX y CSV",
        valor: (plan) => planPermite(plan, "permite_exportacion_csv"),
      },
      {
        label: "Recordatorios manuales por WhatsApp",
        valor: (plan) => planPermite(plan, "permite_recordatorios_whatsapp"),
      },
      {
        label: "Soporte prioritario",
        valor: (plan) => planPermite(plan, "permite_soporte_prioritario"),
      },
    ],
  },
  {
    titulo: "Operación empresarial",
    descripcion: "Control de equipos y ubicaciones",
    filas: [
      {
        label: "Múltiples sucursales",
        valor: (plan) => planPermite(plan, "permite_multiples_sucursales"),
      },
      {
        label: "Accesos para gerente, recepción y personal",
        valor: (plan) => planPermite(plan, "permite_multiples_sucursales"),
      },
      {
        label: "Reportes y filtros por sucursal",
        valor: (plan) => planPermite(plan, "permite_multiples_sucursales"),
      },
      {
        label: "Exportación por sucursal",
        valor: (plan) => planPermite(plan, "permite_multiples_sucursales"),
      },
      {
        label: "Configuración inicial asistida",
        valor: (plan) => planPermite(plan, "permite_multiples_sucursales"),
      },
      {
        label: "Funcionalidades a medida bajo evaluación",
        valor: (plan) => planPermite(plan, "permite_funcionalidades_a_medida"),
      },
    ],
  },
];

function Celda({ valor }: { valor: CeldaValor }) {
  if (typeof valor === "string") {
    return <span className="text-sm font-semibold">{valor}</span>;
  }

  return valor ? (
    <CheckCircle2 className="mx-auto size-5 text-chart-4" aria-label="Incluido" />
  ) : (
    <Minus className="mx-auto size-4 text-muted-foreground/45" aria-label="No incluido" />
  );
}

export function PlanComparisonTable({ planes }: PlanComparisonTableProps) {
  if (planes.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border bg-background shadow-sm">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead>
          <tr className="border-b bg-muted/55">
            <th className="w-[25%] p-4 text-sm font-semibold text-muted-foreground">
              Funcionalidad
            </th>
            {planes.map((plan) => (
              <th
                key={plan.id}
                className={`min-w-36 p-4 text-center text-sm font-bold ${
                  plan.destacado ? "bg-primary/8 text-primary" : ""
                }`}
              >
                {plan.nombre}
                {plan.destacado ? (
                  <span className="mx-auto mt-1 block w-fit rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    Más elegido
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>

        {GRUPOS.map((grupo) => (
          <tbody key={grupo.titulo}>
            <tr className="border-y bg-muted/30">
              <th colSpan={planes.length + 1} className="px-4 py-3">
                <span className="text-sm font-bold">{grupo.titulo}</span>
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {grupo.descripcion}
                </span>
              </th>
            </tr>
            {grupo.filas.map((fila, index) => (
              <tr
                key={fila.label}
                className={`border-b transition-colors hover:bg-muted/25 ${
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
        ))}
      </table>
    </div>
  );
}

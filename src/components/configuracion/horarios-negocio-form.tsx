"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type HorarioNegocioItem = {
  dia_semana: number;
  activo: boolean;
  hora_apertura: string | null;
  hora_cierre: string | null;
};

type HorariosNegocioFormProps = {
  horariosIniciales: HorarioNegocioItem[];
};

const diasSemana = [
  { dia: 0, nombre: "Domingo" },
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
];

function horaInput(valor: string | null) {
  if (!valor) return "";
  return valor.slice(0, 5);
}

function crearHorariosDefault() {
  return diasSemana.map((dia) => {
    const esDiaLaboral = dia.dia >= 1 && dia.dia <= 5;

    return {
      dia_semana: dia.dia,
      activo: esDiaLaboral,
      hora_apertura: esDiaLaboral ? "08:00" : null,
      hora_cierre: esDiaLaboral ? "18:00" : null,
    };
  });
}

export function HorariosNegocioForm({
  horariosIniciales,
}: HorariosNegocioFormProps) {
  const router = useRouter();

  const [horarios, setHorarios] = useState<HorarioNegocioItem[]>(() => {
    if (horariosIniciales.length === 0) {
      return crearHorariosDefault();
    }

    return diasSemana.map((dia) => {
      const encontrado = horariosIniciales.find(
        (item) => item.dia_semana === dia.dia
      );

      if (!encontrado) {
        return {
          dia_semana: dia.dia,
          activo: false,
          hora_apertura: null,
          hora_cierre: null,
        };
      }

      return {
        dia_semana: dia.dia,
        activo: encontrado.activo,
        hora_apertura: horaInput(encontrado.hora_apertura),
        hora_cierre: horaInput(encontrado.hora_cierre),
      };
    });
  });

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function actualizarHorario(
    diaSemana: number,
    campo: "activo" | "hora_apertura" | "hora_cierre",
    valor: boolean | string
  ) {
    setHorarios((actual) =>
      actual.map((horario) => {
        if (horario.dia_semana !== diaSemana) {
          return horario;
        }

        if (campo === "activo") {
          const activo = Boolean(valor);

          return {
            ...horario,
            activo,
            hora_apertura: activo ? horario.hora_apertura ?? "08:00" : null,
            hora_cierre: activo ? horario.hora_cierre ?? "18:00" : null,
          };
        }

        return {
          ...horario,
          [campo]: String(valor),
        };
      })
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setOk(null);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/configuracion/horarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          horarios,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudieron guardar los horarios.";
        setError(message);
        toast.error("No se pudieron guardar los horarios", {
          description: message,
        });
        return;
      }

      setOk("Horarios guardados correctamente.");
      toast.success("Horarios guardados correctamente");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado.");
      toast.error("No se pudieron guardar los horarios");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horarios del negocio
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-hidden rounded-2xl border">
            <div className="divide-y">
              {diasSemana.map((dia) => {
                const horario = horarios.find(
                  (item) => item.dia_semana === dia.dia
                );

                if (!horario) return null;

                return (
                  <div
                    key={dia.dia}
                    className="grid gap-4 p-4 md:grid-cols-[180px_1fr]"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          actualizarHorario(
                            dia.dia,
                            "activo",
                            !horario.activo
                          )
                        }
                        className={`relative h-6 w-11 rounded-full transition ${
                          horario.activo ? "bg-primary" : "bg-muted"
                        }`}
                        aria-label={`Activar ${dia.nombre}`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                            horario.activo ? "left-6" : "left-1"
                          }`}
                        />
                      </button>

                      <div>
                        <p className="font-medium">{dia.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {horario.activo ? "Abierto" : "Cerrado"}
                        </p>
                      </div>
                    </div>

                    {horario.activo ? (
                      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <Input
                          type="time"
                          value={horaInput(horario.hora_apertura)}
                          onChange={(event) =>
                            actualizarHorario(
                              dia.dia,
                              "hora_apertura",
                              event.target.value
                            )
                          }
                          required
                        />

                        <span className="text-center text-muted-foreground">
                          a
                        </span>

                        <Input
                          type="time"
                          value={horaInput(horario.hora_cierre)}
                          onChange={(event) =>
                            actualizarHorario(
                              dia.dia,
                              "hora_cierre",
                              event.target.value
                            )
                          }
                          required
                        />
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-muted-foreground">
                        No se podrán crear citas este día.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {ok && (
            <Alert>
              <AlertDescription>{ok}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Guardando..." : "Guardar horarios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

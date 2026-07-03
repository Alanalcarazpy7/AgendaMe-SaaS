"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ClienteDialog, type ClienteItem } from "@/components/clientes/cliente-dialog";
import { ClienteEstadoButton } from "@/components/clientes/cliente-estado-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type ClientesPanelProps = {
  clientes: ClienteItem[];
};

export function ClientesPanel({ clientes }: ClientesPanelProps) {
  const [busqueda, setBusqueda] = useState("");

  const clientesFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    if (!query) return clientes;

    return clientes.filter((cliente) => {
      return (
        cliente.nombre_completo.toLowerCase().includes(query) ||
        cliente.telefono?.toLowerCase().includes(query) ||
        cliente.email?.toLowerCase().includes(query) ||
        cliente.documento?.toLowerCase().includes(query)
      );
    });
  }, [clientes, busqueda]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-muted-foreground">
            Gestioná la base de clientes de tu negocio.
          </p>
        </div>

        <ClienteDialog variant="crear" />
      </section>

      <section className="flex max-w-md items-center gap-2 rounded-xl border bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar clientes..."
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </section>

      <Card>
        <CardContent className="p-0">
          {clientes.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <p className="font-medium">No hay clientes registrados.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tocá “Nuevo cliente” para cargar el primero.
              </p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <p className="font-medium">No encontramos clientes.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Probá con otro nombre, teléfono, correo o documento.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Teléfono</th>
                      <th className="px-4 py-3 font-medium">Correo</th>
                      <th className="px-4 py-3 font-medium">Documento</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id} className="border-t">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{cliente.nombre_completo}</p>
                            {cliente.notas_internas && (
                              <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                                {cliente.notas_internas}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {cliente.telefono ?? "-"}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {cliente.email ?? "-"}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {cliente.documento ?? "-"}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              cliente.estado === "activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {cliente.estado}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ClienteDialog variant="editar" cliente={cliente} />
                            <ClienteEstadoButton
                              clienteId={cliente.id}
                              estado={cliente.estado}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { z } from "zod";

export const editarPlanSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1).max(80),
  descripcionCorta: z.string().max(300).optional().nullable(),
  textoDestacado: z.string().max(120).optional().nullable(),
  precioMensualGs: z.coerce.number().int().min(0),
  precioAnualGs: z.coerce.number().int().min(0),
  limiteCitasMensuales: z.coerce.number().int().min(0).optional().nullable(),
  limiteEmpleados: z.coerce.number().int().min(0).optional().nullable(),
  limiteServicios: z.coerce.number().int().min(0).optional().nullable(),
  limiteClientes: z.coerce.number().int().min(0).optional().nullable(),
  limiteSucursales: z.coerce.number().int().min(0).optional().nullable(),
  visiblePublico: z.boolean(),
  destacado: z.boolean(),
});

export type EditarPlanInput = z.infer<typeof editarPlanSchema>;

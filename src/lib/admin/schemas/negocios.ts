import { z } from "zod";

export const cambiarPlanSchema = z.object({
  negocioId: z.string().uuid(),
  planClave: z.string().min(1).max(60),
  fechaVencimiento: z.string().min(1).optional().nullable(),
  notas: z.string().max(2000).optional().nullable(),
});

export type CambiarPlanInput = z.infer<typeof cambiarPlanSchema>;

export const bloquearNegocioSchema = z.object({
  negocioId: z.string().uuid(),
  motivo: z.string().min(3).max(500),
});

export type BloquearNegocioInput = z.infer<typeof bloquearNegocioSchema>;

export const desbloquearNegocioSchema = z.object({
  negocioId: z.string().uuid(),
});

export type DesbloquearNegocioInput = z.infer<typeof desbloquearNegocioSchema>;

export const aprobarPagoSchema = z.object({
  pagoId: z.string().uuid(),
  negocioId: z.string().uuid(),
  fechaVencimiento: z.string().min(1),
  notas: z.string().max(2000).optional().nullable(),
});

export type AprobarPagoInput = z.infer<typeof aprobarPagoSchema>;

export const rechazarPagoSchema = z.object({
  pagoId: z.string().uuid(),
  negocioId: z.string().uuid(),
  notas: z.string().max(2000).optional().nullable(),
});

export type RechazarPagoInput = z.infer<typeof rechazarPagoSchema>;

export const agregarNotaSchema = z.object({
  negocioId: z.string().uuid(),
  nota: z.string().min(1).max(2000),
});

export type AgregarNotaInput = z.infer<typeof agregarNotaSchema>;

export const registrarPagoSchema = z.object({
  negocioId: z.string().uuid(),
  suscripcionId: z.string().uuid().optional().nullable(),
  planId: z.string().uuid(),
  montoGs: z.coerce.number().int().positive(),
  metodo: z.string().min(1).max(80),
  periodoInicio: z.string().min(1).optional().nullable(),
  periodoFin: z.string().min(1).optional().nullable(),
  notasCliente: z.string().max(2000).optional().nullable(),
});

export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;

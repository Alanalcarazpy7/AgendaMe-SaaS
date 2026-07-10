import { z } from "zod";

export const editarPerfilPropietarioSchema = z.object({
  nombre: z.string().min(1).max(120),
  avatarUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  tema: z.enum(["sistema", "claro", "oscuro"]),
});

export type EditarPerfilPropietarioInput = z.infer<typeof editarPerfilPropietarioSchema>;

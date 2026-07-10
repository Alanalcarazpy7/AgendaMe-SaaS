import { z } from "zod";

export const revocarInvitacionSchema = z.object({
  invitacionId: z.string().uuid(),
});

export type RevocarInvitacionInput = z.infer<typeof revocarInvitacionSchema>;

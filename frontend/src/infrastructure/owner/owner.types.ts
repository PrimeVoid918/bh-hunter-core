// owner.types.ts
import { z } from 'zod';
import { BaseUserSchema } from '../user/user.types';
// import { BoardingHousesIdList } from '../boarding-houses/boarding-house.types';
import { PermitMetaData } from '../valid-docs/permits.types';

// Base schema
export const OwnerSchema = BaseUserSchema.extend({
  role: z.literal('OWNER').optional(),
  // boardingHouses: z.array(z.custom<BoardingHousesIdList>()).optional(),
  permits: z.array(z.custom<PermitMetaData>()).optional(),
});
export type Owner = z.infer<typeof OwnerSchema>;

// For create
export const CreateOwnerSchema = OwnerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateOwner = z.infer<typeof CreateOwnerSchema>;

// For update (all fields optional)
export const UpdateOwnerSchema = CreateOwnerSchema.partial();
export type UpdateOwner = z.infer<typeof UpdateOwnerSchema>;

// For fetching/reading (id + fullname + timestamps enforced)
export const GetOwnerSchema = OwnerSchema.extend({
  id: z.number(),
  fullname: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type GetOwner = z.infer<typeof GetOwnerSchema>;

// State
export interface OwnerState {
  selectedUser: Owner | null;
  filter: string | null;
  loading: boolean;
  error: string | null;
}

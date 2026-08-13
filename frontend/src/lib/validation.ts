import { z } from "zod";

export const vehicleCreateSchema = z.object({
  rcNumber: z.string().min(5, "RC number required"),
  owner: z.object({
    name: z.string().min(2, "Owner name required"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    aadhaarLast4: z.string().length(4, "Last 4 digits").optional().or(z.literal(""))
  }),
  registrationState: z.string().min(2, "State required"),
  chassisNumber: z.string().min(3, "Chassis required"),
  engineNumber: z.string().min(3, "Engine required"),
  vehicleInfo: z.object({
    make: z.string().min(2, "Make required"),
    model: z.string().min(1, "Model required"),
    manufactureYear: z.union([z.string(), z.number()]).refine(v => String(v).length > 0, "Year required"),
    color: z.string().optional().or(z.literal("")),
    fuelType: z.string().optional().or(z.literal("")),
    type: z.string().optional().or(z.literal("")),
    variant: z.string().optional().or(z.literal(""))
  }),
  insurance: z.object({
    provider: z.string().optional().or(z.literal("")),
    policyNumber: z.string().optional().or(z.literal("")),
    validTill: z.string().optional().or(z.literal(""))
  }),
  puc: z.object({
    certificateNumber: z.string().optional().or(z.literal("")),
    validTill: z.string().optional().or(z.literal(""))
  }),
  registrationInfo: z.object({
    active: z.boolean(),
    registrationDate: z.string().optional().or(z.literal("")),
    validTill: z.string().optional().or(z.literal(""))
  }),
  previousOwners: z.array(z.string().min(1)).optional(),
  stolen: z.boolean(),
  suspicious: z.boolean()
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;

export const transferSchema = z.object({
  rcNumber: z.string().min(5, "RC number required"),
  newOwner: z.object({
    name: z.string().min(2, "New owner name required"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    aadhaarLast4: z.string().length(4, "Last 4 digits").optional().or(z.literal(""))
  }),
  adminKey: z.string().optional()
});

export type TransferInput = z.infer<typeof transferSchema>;

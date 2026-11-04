
import * as z from 'zod';

const registerDeceasedSchema = z.object({
    full_name: z
        .string()
        .min(4, "Full name must have at least 4 characters")
        .max(30, "Full name must be at most 30 characters long"),

    cause_of_death: z.string().optional().nullable(),
    national_id: z.string().optional().nullable(),
    received_from: z.string().optional(),
    permit_no: z.string().optional().nullable(),

    age: z.number().int().min(0).optional().nullable(),

    time_received: z.string(),

    body_status: z.string().optional().nullable(),

    contact_person: z
        .string()
        .refine(
            (val) => val.length > 3,
            "Contact person must have at least 4 characters"
        )
        .max(10, "Contact person must not exceed 10 characters"),

    tell_no: z.string().optional().nullable(),

    gender: z
        .string()
        .refine(
            (val) => val === 'male' || val === 'female',
            'Invalid Gender'
        )
        .readonly(),

    date_of_death: z.string().optional().nullable(),
    signature: z.string().optional().nullable(),
    place_of_death: z.string().optional().nullable(),
    id_type: z.string().optional().nullable(),
    alternative_phone: z.string().optional().nullable(),

    email: z
        .string()
        .email("Invalid email address")
        .optional()
        .nullable(),

    receiving_officer: z.string().optional().nullable(),

    relationship: z.string(),
});

export type RegisterDeceasedInput = z.infer<typeof registerDeceasedSchema>;

export default registerDeceasedSchema;

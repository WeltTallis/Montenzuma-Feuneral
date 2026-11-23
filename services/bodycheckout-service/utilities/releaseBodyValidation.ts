
import * as Zod from "zod";


// REUSABLE VALIDATION HELPERS


// Required string validation
const requiredString = (field: string) =>
    Zod.z
        .string({
            error: `${field} is required`,
        })
        .trim()
        .min(1, `${field} is required`);

// Optional string validation
const optionalString = () =>
    Zod.z.string().trim().optional();


// KENYAN PHONE NUMBER VALIDATION


const phoneNumberSchema = Zod.z
    .string({
        error: "Telephone number is required",
    })
    .trim()
    .min(1, "Telephone number is required")
    .regex(
        /^(?:\+254|254|0)(?:7|1)\d{8}$/,
        "Enter a valid Kenyan phone number"
    );


// DATE VALIDATION (YYYY-MM-DD)


const dateSchema = Zod.z
    .string()
    .trim()
    .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date must be in YYYY-MM-DD format"
    )
    .refine((value) => {
        const date = new Date(`${value}T00:00:00`);

        return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
        );
    }, {
        message: "Enter a valid date",
    });


// TIME VALIDATION (24-HOUR FORMAT)


const timeSchema = Zod.z
    .string()

// Optional date and time fields
const optionalDate = dateSchema.optional();
const optionalTime = timeSchema.optional();


// MAIN RELEASE BODY VALIDATION SCHEMA


const releaseBodySchema = Zod.z
    .object({


        // NEXT OF KIN DETAILS


        id_number: requiredString("ID number")
            .max(30, "ID number cannot exceed 30 characters"),

        next_kin: requiredString("Next of kin")
            .max(100, "Next of kin cannot exceed 100 characters"),

        tell_number: phoneNumberSchema,

        relationship: requiredString("Relationship")
            .max(50, "Relationship cannot exceed 50 characters"),

        terms_accepted: Zod.z
            .boolean({
                error: "You must accept the terms before proceeding",
            })
            .refine((value) => value === true, {
                message: "You must accept the terms before proceeding",
            }),

        everything_paid: Zod.z.boolean({
            error: "Please confirm whether everything has been paid",
        }),


        // ADMISSION DETAILS


        admission_number: optionalString(),

        name_of_deceased: optionalString(),

        // REMOVAL DETAILS


        date_of_removal: optionalDate,

        time_of_removal: optionalTime,

        permit_number: optionalString(),


        // TRANSPORT DETAILS


        mode_of_transport: optionalString(),

        final_destination: optionalString(),

        plate_number: optionalString(),

        // RELEASE DETAILS


        release_date: optionalDate,

        release_time: optionalTime,

        time_received: optionalTime,


        // SIGNATURES AND STAFF DETAILS


        signature: optionalString(),

        staff_name: optionalString(),

        staff_signature: optionalString(),

        received_by: optionalString(),

        items_returned: optionalString(),

        notes: optionalString(),

        released_by: optionalString(),

    })


    // CONDITIONAL VALIDATION RULES


    .superRefine((data, ctx) => {


        // PAYMENT VALIDATION


        if (data.everything_paid !== true) {
            ctx.addIssue({
                code: "custom",
                path: ["everything_paid"],
                message: "Payment must be confirmed before release",
            });
        }


        // TRANSPORT VALIDATION


        if (
            data.mode_of_transport &&
            !data.final_destination
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["final_destination"],
                message: "Final destination is required when transport mode is provided",
            });
        }

        // Require vehicle registration for vehicle transport
        if (
            data.mode_of_transport?.toLowerCase() === "vehicle" &&
            !data.plate_number
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["plate_number"],
                message: "Vehicle registration number is required",
            });
        }


        // DATE VALIDATION


        if (
            data.release_date &&
            data.date_of_removal &&
            data.release_date < data.date_of_removal
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["release_date"],
                message: "Release date cannot be before the removal date",
            });
        }

        // ----------------------------------
        // TIME VALIDATION
        // ----------------------------------

        if (
            data.release_date === data.date_of_removal &&
            data.release_time &&
            data.time_of_removal &&
            data.release_time < data.time_of_removal
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["release_time"],
                message: "Release time cannot be before removal time",
            });
        }

    });


// TYPESCRIPT TYPE


export type ReleaseBodyInput = Zod.z.infer<
    typeof releaseBodySchema
>;


// EXPORT


export default releaseBodySchema;

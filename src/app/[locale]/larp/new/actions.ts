"use server";

import { auth } from "@/auth";
import { EditStatus, EditType, SubmitterRole } from "@/generated/prisma";
import prisma from "@/prisma";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod";

const zPlainDateNull = z
  .string()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    return Temporal.PlainDate.from(val);
  });

const zSubmitterRole = z.enum<typeof SubmitterRole>(SubmitterRole);

const CreateLarpForm = z.object({
  submitterName: z.string().min(1).max(100).optional(),
  submitterEmail: z.email().optional(),
  submitterRole: zSubmitterRole,

  name: z.string().min(1).max(200),
  tagline: z.string().max(500).optional(),
  locationText: z.string().max(200).optional(),
  fluffText: z.string().max(2000).optional(),
  description: z.string().max(2000).optional(),
  message: z.string().max(2000).optional(),

  startsAt: zPlainDateNull,
  endsAt: zPlainDateNull,
  signupStartsAt: zPlainDateNull,
  signupEndsAt: zPlainDateNull,

  cat: z.coerce.string().lowercase().optional(),
});

const acceptableFelines = ["cat", "kissa", "katt"];

export async function createLarp(data: FormData) {
  const session = await auth();
  const user = session?.user;

  const parsed = CreateLarpForm.parse(Object.fromEntries(data.entries()));

  const {
    submitterName = user?.name,
    submitterEmail = user?.email,
    submitterRole,
    message,
    cat,
    ...newContent
  } = parsed;

  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  if (
    !user &&
    !(cat && acceptableFelines.some((feline) => cat.includes(feline)))
  ) {
    throw new Error("You might be a robot");
  }

  await prisma.editLarpRequest.create({
    data: {
      type: EditType.CREATE,
      status: EditStatus.PENDING_VERIFICATION,
      submitterName,
      submitterEmail,
      submitterRole,
      message,
      newContent: Object.fromEntries(
        Object.entries(newContent).filter(([_, v]) => v !== null && v !== "")
      ),
    },
  });
}

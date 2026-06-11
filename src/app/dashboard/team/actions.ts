"use server";

import prisma from "../../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function addMember(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string || "Member";

  if (!name) return;

  await prisma.member.create({
    data: { name, email, role }
  });

  revalidatePath("/dashboard/team");
}

export async function removeMember(id: string) {
  await prisma.member.delete({
    where: { id }
  });
  revalidatePath("/dashboard/team");
}

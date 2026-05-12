import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, activo: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const body = await req.json();
  const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : null;
  const user = await prisma.user.upsert({
    where: { email: body.email },
    update: {
      name: body.name,
      role: body.role,
      activo: body.activo ?? true,
      ...(passwordHash ? { passwordHash } : {}),
    },
    create: {
      email: body.email,
      name: body.name,
      role: body.role || "SALES",
      activo: body.activo ?? true,
      passwordHash,
    },
    select: { id: true, name: true, email: true, role: true, activo: true, createdAt: true },
  });
  return NextResponse.json(user);
}

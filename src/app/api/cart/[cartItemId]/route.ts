import { NextResponse } from "next/server";
import { deleteCartItem } from "@/lib/cart";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function DELETE(_: Request, { params }: { params: { cartItemId: string } }) {
  const session = await getServerSession(authOptions);
  await deleteCartItem(params.cartItemId, session?.user?.id);
  return NextResponse.json({ status: "ok" });
}

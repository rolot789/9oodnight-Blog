import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { signOutWithRedirect } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const response = await signOutWithRedirect(request, "/");
    revalidatePath("/", "layout");
    return response;
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.redirect(new URL("/", request.url), {
      status: 302,
    });
  }
}

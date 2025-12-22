import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 서버 사이드 Supabase 클라이언트가 자동으로
    // 요청의 쿠키에서 세션을 읽고 Authorization 헤더를 생성
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Sign out error:", error);
    // 에러가 발생해도 계속 진행
  }

  revalidatePath("/", "layout");

  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 302,
  });

  // 쿠키 제거
  response.cookies.delete("sb-yzazdyirtqrgoekragie-auth-token");
  response.cookies.delete("sb-yzazdyirtqrgoekragie-auth-token-code-verifier");

  return response;
}

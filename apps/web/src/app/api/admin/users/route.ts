import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await requireAdmin(user.id);

    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page") ?? "1");
    const perPage = Number(searchParams.get("perPage") ?? "50");

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    return ok({ users: data.users });
  } catch (error) {
    return fail(error);
  }
}



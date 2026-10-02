import { handleAuthCallback } from "@/lib/data/auth-callback";
export async function GET(request: Request) { return handleAuthCallback(request); }

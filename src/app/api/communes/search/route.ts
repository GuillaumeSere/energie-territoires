import { searchCommunes } from "@/lib/communes";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 8);

  if (query.trim().length < 2) {
    return Response.json({ communes: [] });
  }

  const communes = await searchCommunes(query, Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 12) : 8);

  return Response.json({ communes });
}

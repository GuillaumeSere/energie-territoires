import { getTerritory } from "@/lib/ore";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const territory = await getTerritory(code);

  if (!territory) {
    return Response.json({ error: "Territoire introuvable" }, { status: 404 });
  }

  return Response.json(territory);
}

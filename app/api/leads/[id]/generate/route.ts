// Stub for demo generation. Templates (Phase 0.5) are not yet built.
// When templates land, this handler will: validate lead state, transition
// scored → approved → demo_generated, call lib/generation/, create the
// DemoSite row, and deploy to <slug>.frontdoor-demos.com.

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return Response.json(
    {
      error:
        "Demo generation not yet implemented — templates pending Phase 0.5",
      leadId: id,
    },
    { status: 501 }
  );
}

const GRAPH = "https://graph.facebook.com/v23.0";
const { IG_USER_ID, IG_ACCESS_TOKEN, VIDEO_URL } = process.env;

if (!IG_USER_ID || !IG_ACCESS_TOKEN || !VIDEO_URL) {
  console.error("Usage: IG_USER_ID=... IG_ACCESS_TOKEN=... VIDEO_URL=... npx tsx scripts/ig-test-publish.ts");
  process.exit(1);
}

async function graphPost(path: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    body: new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN! }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(JSON.stringify(json.error ?? json));
  return json;
}

async function main() {
  console.log("1/3 creating media container…");
  const { id: creationId } = await graphPost(`${IG_USER_ID}/media`, {
    media_type: "STORIES",
    video_url: VIDEO_URL!,
  });
  console.log("   container:", creationId);

  console.log("2/3 waiting for processing…");
  for (let i = 0; i < 24; i++) {
    const res = await fetch(`${GRAPH}/${creationId}?fields=status_code&access_token=${IG_ACCESS_TOKEN}`);
    const { status_code } = await res.json();
    console.log("   status:", status_code);
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR") throw new Error("Container processing failed");
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log("3/3 publishing…");
  const { id } = await graphPost(`${IG_USER_ID}/media_publish`, { creation_id: creationId });
  console.log("PUBLISHED, media id:", id);
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });

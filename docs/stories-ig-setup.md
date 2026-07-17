# Instagram API — jednorázové nastavení

1. **Propoj IG s FB stránkou:** Instagram appka → Nastavení → Business tools → propojit s FB stránkou (musíš být admin stránky).
2. **Meta app:** https://developers.facebook.com → My Apps → Create App → typ "Business". App zůstává v Development módu (pro vlastní účet stačí).
3. **Oprávnění:** V Graph API Exploreru (https://developers.facebook.com/tools/explorer) vyber svou app a vygeneruj User Token s oprávněními:
   `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`.
4. **Dlouhodobý token:**
   `curl "https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$FB_APP_ID&client_secret=$FB_APP_SECRET&fb_exchange_token=$KRATKY_TOKEN"`
   → `access_token` (platnost 60 dní) → env `IG_ACCESS_TOKEN`.
5. **IG User ID:**
   `curl "https://graph.facebook.com/v23.0/me/accounts?access_token=$TOKEN"` → vezmi `id` stránky, pak
   `curl "https://graph.facebook.com/v23.0/<PAGE_ID>?fields=instagram_business_account&access_token=$TOKEN"`
   → `instagram_business_account.id` → env `IG_USER_ID`.
6. **Test:** vyexportuj MP4 ze story-generatoru, nahraj ručně do Cloudinary (Media Library, folder `stories`), zkopíruj delivery URL (`https://res.cloudinary.com/<cloud>/video/upload/<id>.mp4`) a spusť:
   `IG_USER_ID=... IG_ACCESS_TOKEN=... VIDEO_URL=... npx tsx scripts/ig-test-publish.ts`
7. Ověř v IG appce, že story je publikovaná. Pokud Graph API vrátí chybu na video specs, zkus URL s transformací `.../video/upload/f_mp4,vc_h264/<id>.mp4` a zapiš výsledek sem.

## Nasazení — checklist

- [ ] Vercel env: IG_USER_ID, IG_ACCESS_TOKEN, FB_APP_ID, FB_APP_SECRET, CRON_SECRET, ANTHROPIC_API_KEY (+ volitelně RESEND_API_KEY, STORIES_NOTIFY_EMAIL)
- [ ] Spike proběhl úspěšně (scripts/ig-test-publish.ts) — PŘED zapnutím cronu
- [ ] Publish trigger: GitHub Actions workflow `.github/workflows/stories-publish.yml` (à 30 min) — přidat repo secret `CRON_SECRET` (GitHub → Settings → Secrets and variables → Actions) se stejnou hodnotou jako ve Vercelu. Vercel Hobby sub-denní cron neumí; týdenní drafts cron ve vercel.json funguje i na Hobby. Alternativa bez GH Actions: cron-job.org s hlavičkou `Authorization: Bearer <CRON_SECRET>` na /api/cron/stories-publish. Pozn.: příspěvek se publikuje s max ~30min zpožděním po naplánovaném čase.
- [ ] První ostrý průchod: ručně GET /api/cron/stories-drafts (s Bearer CRON_SECRET), schválit 1 návrh, ručně GET /api/cron/stories-publish, ověřit story na IG
- [ ] Naplnit zásobník textů v /admin/stories → Texty (aspoň 2× C, 2× D)

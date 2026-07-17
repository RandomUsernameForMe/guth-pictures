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

// Soul Nine quiz - site settings. Edit this file, then run `npm run build` (updates the share pages
// and preview images). Everything here is public (it ships to the browser).
export default {
  // Your domain, with https:// and no trailing slash. Used for share links and link previews.
  siteUrl: "https://soulnine.example",          // TODO: replace with your domain
  // Text printed on the share cards (keep it short).
  cardDomain: "soulnine.example",               // TODO: replace with your domain

  // Steam store link. "utm_source=quiz" lets you see quiz traffic in Steam's UTM report.
  steamUrl: "https://store.steampowered.com/app/4060630/Soul_Nine/?utm_source=quiz&utm_medium=web&utm_campaign=personality_test",
  steamButtonText: "Wishlist Soul Nine on Steam",
  // Optional trailer link (YouTube/Steam). Empty = hidden.
  trailerUrl: "",

  // Social handles shown at the bottom (empty = hidden). Full URLs.
  social: {
    tiktok: "",
    youtube: "",
    x: "",
    instagram: "",
    discord: "",
  },

  // Share links point to /type/<n>?w=<wing>. Cloudflare Pages, Netlify and GitHub Pages all serve
  // /type/6 from type/6.html. Set to false to use /type/6.html links instead.
  prettyUrls: true,

  // "X% of people share your type". OFF by default - only turn on with REAL numbers from your own data.
  typeShare: {
    enabled: false,
    percentByType: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null },
  },

  // Privacy-friendly analytics (nothing is loaded by default). Choose ONE:
  //  - Cloudflare Web Analytics: paste the token from the Cloudflare dashboard.
  //  - Plausible: put your domain as registered in Plausible.
  analytics: {
    cloudflareToken: "",
    plausibleDomain: "",
  },
};

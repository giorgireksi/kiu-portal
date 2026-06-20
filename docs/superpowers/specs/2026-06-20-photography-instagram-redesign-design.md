# Photography Section — Instagram-style Redesign

**Date:** 2026-06-20
**Scope:** Rebuild the `photography` panel of the campus social network into an
Instagram-style photo experience (feed, explore, post detail w/ comments,
profile) with a distinctive luxe **dark+light** aesthetic. Follow / like /
comment / share are **server-persisted** by reusing the existing social-posts
backend. Not an Instagram clone — an editorial "campus gallery".

## Architecture decision

A photo **is a real social post** tagged `category: "Photography"`. This reuses
the complete, already-built, server-persisted social-posts system instead of the
current localStorage silo. Likes, comments, shares, follows become shared across
all users for free.

- Photo post = `createSocialPost({ scopeType:'profile', media:[image], category:'Photography', body:caption })`.
- Photography panel reads `runtime.feed` filtered to `category === 'Photography'`.
- Photography posts are **excluded from the main community feed** (decision: section-only).

### Why this over a parallel store
Rung 4 of the ladder: an already-installed system solves it. Building a second
persistence layer (likes/comments/follows) for photography would duplicate the
entire social backend. Reuse wins.

## Data flow

```
upload  → submitSocialPost(caption, {file, category:'Photography'})
like    → reactToPortalSocialPost(postId, 'like')
comment → commentOnPortalSocialPost(postId, text)
share   → sharePortalSocialPost(postId, note)  +  clipboard link + toast
follow  → togglePortalSocialFollow('profile', personId)
read    → getPortalSocialRuntimeState().feed.filter(p => p.category==='Photography')
follows → runtime.social.relationships  (type:'follow', from/to)
```

Post shape (from `decorateSocialPost`): `{ id, authorUserId, body, caption,
media[], category, reactions, likes[], reactionCounts, viewerReaction,
comments[] (tree), commentCount, createdAt }`.

## Backend changes (minimal)

1. `social-content-service.js :: createSocialPost` — persist
   `category: socialText(payload.category || '')` on the post object.
   `decorateSocialPost` already spreads `...normalized`, so it flows to the feed
   with no serializer change.

## SDK changes (`social-runtime-lite.js`)

2. `createPost(body, options)` — forward `category: text(options.category || '')`
   into the `/api/social/posts` payload.

## Frontend changes (`social-page.js`)

3. `filterFeedForHome(feed, …)` — prepend
   `feed = feed.filter(p => text(p.category) !== 'Photography')` so photography
   never appears in the main feed (all home filters).
4. Rewrite the photography render layer:
   - `renderPhotographyPanel()` — topbar (search + Feed/Explore tabs + Share btn),
     followed-photographers rail, **vertical post-card feed** (default), right
     rail (who-to-follow + trending tags, desktop). Explore tab = masonry grid.
   - `renderPhotographyPhotoDetail()` — split lightbox: image left, author +
     comment thread + composer + like/comment/share right.
   - `renderPhotographyProfileDetail()` — cover header, avatar, stats
     (photos / likes / followers), follow/edit button, 3-col grid.
   - `renderPhotographyUploadForm()` — keep, restyle; on submit call
     `submitSocialPost`.
   - `renderPhotoCard()` — feed post card: header (avatar/name/faculty/time),
     image, action bar (♥ like · 💬 comments · ↗ share), caption, comment peek,
     inline add-comment.
5. Replace localStorage logic (`photographyData._meta` likes/follows/comments/
   uploads, `togglePhotoLike`, `togglePhotoFollow`, `photographyData`,
   `photographyGetPhotoFeed`) with reads from the social runtime + SDK calls.
   Keep `_ui` view-state (search / faculty / viewing / tab) in a small local
   object (it's ephemeral UI, not data).
6. Update the photography action handlers (`photography-like`, `-follow`,
   `-comment`, `-share`, `-view-photo`, `-view-profile`, `-upload-submit`, …) to
   call the SDK and `renderSocialPageNow`.

## CSS changes (`photography-redesign.css`)

7. Full rewrite. Use existing `--lux-*` tokens (already have dark+light
   variants) so both themes work automatically. Editorial gallery aesthetic:
   big imagery, gold-thread accents, glass surfaces, distinctive display font
   for headings + clean body font, staggered load reveal, hover micro-states.
   Responsive: desktop 3-col (rail/feed/rail), tablet 2-col, mobile single col.

## Out of scope (YAGNI)

- Stories (platform has them elsewhere), DMs (Inbox panel exists), hashtag pages
  (trending is display-only), real-time sockets.

## Known ceilings (ponytail)

- Photography feed reads from the paginated `runtime.feed`; very old photos
  beyond the loaded page won't show until feed pagination loads more. Acceptable
  for launch; upgrade path = a `category=photography` feed query param.

## Verification

- Upload a photo → appears in photography feed, NOT in main feed.
- Like / comment / share / follow → persists across reload (server) and is
  visible to another user/session.
- Toggle light/dark → both render correctly, everything functional.

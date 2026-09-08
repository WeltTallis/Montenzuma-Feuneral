$ErrorActionPreference = 'Stop'
$p = 'services/tenant-service/routes/blogEngagementRoutes.ts'
$c = [System.IO.File]::ReadAllText((Resolve-Path $p))
$nl = "`r`n"

# --- 1) seedPost: launch seed for architecture-of-blooms ---
$old1 = @('    return { views: 0, likes: 0, comments: [] };', '}') -join $nl
$new1 = @(
"    if (slug === 'architecture-of-blooms') {",
"        return {",
"            views: 9840,",
"            likes: 612,",
"            comments: [",
"                {",
"                    id: 'c_seed_achieng',",
"                    name: 'Achieng O.',",
"                    text: 'The side-by-side catalog view sold it for us. Families used to flip through a paper folder while grieving - now they browse blooms together on the tablet and it feels like part of the farewell, not a transaction.',",
"                    date: isoDaysAgo(4),",
"                    resonates: 27,",
"                },",
"                {",
"                    id: 'c_seed_mwangi',",
"                    name: 'Sam M.',",
"                    text: 'Great write-up. The part about suppliers updating their own stock is underrated - our florist uploads every Monday morning and we never have to chase anyone anymore.',",
"                    date: isoDaysAgo(9),",
"                    resonates: 18,",
"                },",
"            ],",
"        };",
"    }",
$old1
) -join $nl

# --- 2) knownSlugs: include the flagship article ---
$old2 = @("    const knownSlugs = [", "        'future-of-death-care-software-restpoint',") -join $nl
$new2 = @("    const knownSlugs = [", "        'architecture-of-blooms',", "        'future-of-death-care-software-restpoint',") -join $nl

# --- 3) getPost: launch-seed self-heal ---
$old3 = @(
"function getPost(store: BlogStore, slug: string): BlogPostData {",
"    if (!store.posts[slug]) {",
"        store.posts[slug] = seedPost(slug);",
"    }",
"    return store.posts[slug];",
"}"
) -join $nl
$new3 = @(
"function getPost(store: BlogStore, slug: string): BlogPostData {",
"    const seed = seedPost(slug);",
"    const existing = store.posts[slug];",
"    if (!existing) {",
"        store.posts[slug] = seed;",
"    } else if (",
"        // Launch-seed self-heal: if this deployment saved the post as all",
"        // zeros (before the launch data existed), refresh it once. The moment",
"        // ANY real engagement exists we never touch the record again.",
"        seed.views > 0 &&",
"        !existing.views &&",
"        !existing.likes &&",
"        (existing.comments || []).length === 0",
"    ) {",
"        store.posts[slug] = seed;",
"    }",
"    return store.posts[slug];",
"}"
) -join $nl

foreach ($t in @(@('seedPost', $old1, $new1), @('knownSlugs', $old2, $new2), @('getPost', $old3, $new3))) {
    if (-not $c.Contains($t[1])) { throw "PATCH FAILED: '$($t[0])' anchor not found" }
    $c = $c.Replace($t[1], $t[2])
    Write-Host "patched: $($t[0])"
}

[System.IO.File]::WriteAllText((Resolve-Path $p), $c, [System.Text.UTF8Encoding]::new($true))
Write-Host 'DONE'
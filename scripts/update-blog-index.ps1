$p = 'c:\Users\User\Downloads\restpoint\FrontendClient\client\src\modules\blog\BlogIndex.jsx'
$c = Get-Content $p -Raw
$old = "const POSTS = [" + "`n" + "  {" + "`n" + "    to: '/blog/future-of-death-care-software-restpoint'"
$new = "const POSTS = [" + "`n" + "  {" + "`n" + "    to: '/blog/architecture-of-blooms'," + "`n" + "    category: 'Vol. 02'," + "`n" + "    read: '7 min read'," + "`n" + "    date: 'October 2026'," + "`n" + "    title: 'The Architecture'," + "`n" + "    accent: 'of Blooms.'," + "`n" + "    excerpt: 'Why we digitized the floral selection process, replacing glossy catalogs and stressful phone calls with a serene, educational marketplace right on the funeral home's tablet.'," + "`n" + "    author: 'Restpoint Design Team'," + "`n" + "    featured: true," + "`n" + "  }," + "`n" + "  {" + "`n" + "    to: '/blog/future-of-death-care-software-restpoint'"
$c = $c -replace [regex]::Escape($old), $new
Set-Content $p $c -Encoding UTF8
Write-Output "done"

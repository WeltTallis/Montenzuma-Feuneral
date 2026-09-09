import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

/* =================================================================
    Blog Engagement API - views / likes / comments for Restpoint Journal
    Persisted in a simple JSON file so no extra database is needed.
    Default storage: /opt/storage/blog-data (the shared host bind mount,
    uid-1001 writable). Falls back to ./data, then the OS temp dir.

    ENDPOINTS ARE PUBLICLY ACCESSIBLE - No authentication required.
    New clients without tokens can access all blog endpoints.
    ================================================================= */

const router = Router();

interface BlogComment {
    id: string;
    name: string;
    text: string;
    date: string;
    resonates: number;
}

interface BlogPostData {
    views: number;
    likes: number;
    comments: BlogComment[];
}

interface RequestCounts {
    totalRequests: number;
    getRequests: number;
    postRequests: number;
    viewRequests: number;
    likeRequests: number;
    commentRequests: number;
    resonateRequests: number;
    uniqueClients: string[];
    lastRequestAt: string;
}

interface BlogStore {
    posts: Record<string, BlogPostData>;
    requestCounts: RequestCounts;
}

const isoDaysAgo = (days: number): string => new Date(Date.now() - days * 86400000).toISOString();

// Seed data for launch - the flagship Journal article ships with its
// community discussion (matches the published design).
function seedPost(slug: string): BlogPostData {
    if (slug === 'future-of-death-care-software-restpoint') {
        return {
            views: 14300,
            likes: 847,
            comments: [
                {
                    id: 'c_seed_kariuki',
                    name: 'Kariuki M.',
                    text: 'Incredible vision, Peter. The cost of infrastructure in Africa is a real barrier. If you can make this affordable for the local funeral homes, you are not just changing businesses, you are changing society\u2019s relationship with grief and closure.',
                    date: isoDaysAgo(5),
                    resonates: 32,
                },
                {
                    id: 'c_seed_wanjiru',
                    name: 'Wanjiru K.',
                    text: 'Truth matters. That line alone is powerful. We should not have to beg for the data surrounding our loved ones passing. Looking forward to seeing Restpoint roll out across East Africa.',
                    date: isoDaysAgo(7),
                    resonates: 21,
                },
            ],
        };
    }
    return { views: 0, likes: 0, comments: [] };
}

function seedRequestCounts(): RequestCounts {
    return {
        totalRequests: 0,
        getRequests: 0,
        postRequests: 0,
        viewRequests: 0,
        likeRequests: 0,
        commentRequests: 0,
        resonateRequests: 0,
        uniqueClients: [],
        lastRequestAt: new Date().toISOString(),
    };
}

// ---- JSON-file storage -------------------------------------------------

function resolveDataFile(): string {
    const candidates = [
        process.env.BLOG_DATA_DIR || '/opt/storage/blog-data',
        path.join(process.cwd(), 'data'),
        path.join(os.tmpdir(), 'restpoint-blog-data'),
    ];
    for (const dir of candidates) {
        try {
            fs.mkdirSync(dir, { recursive: true });
            fs.accessSync(dir, fs.constants.W_OK);
            return path.join(dir, 'blog-engagement.json');
        } catch {
            // try the next candidate
        }
    }
    return path.join(os.tmpdir(), 'blog-engagement.json');
}

const DATA_FILE = resolveDataFile();

function saveStore(store: BlogStore): void {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tmp, DATA_FILE);
}

function loadStore(): BlogStore {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as BlogStore;
            if (parsed && typeof parsed === 'object' && parsed.posts) {
                // Ensure requestCounts exists (migration for existing data)
                if (!parsed.requestCounts) {
                    parsed.requestCounts = seedRequestCounts();
                }
                // Ensure uniqueClients array exists
                if (!Array.isArray(parsed.requestCounts.uniqueClients)) {
                    parsed.requestCounts.uniqueClients = [];
                }
                return parsed;
            }
        }
    } catch {
        // File missing or corrupt -> start fresh
    }
    return { posts: {}, requestCounts: seedRequestCounts() };
}

function getPost(store: BlogStore, slug: string): BlogPostData {
    if (!store.posts[slug]) {
        store.posts[slug] = seedPost(slug);
    }
    return store.posts[slug];
}

// ---- Request Counting Middleware -----------------------------------------
// Tracks all requests to blog endpoints for analytics
// Works for ALL clients - including new clients without tokens

const slugOf = (req: Request): string =>
    String(req.params.slug || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '') || 'unknown';

function getClientIdentifier(req: Request): string {
    // Use IP address + User-Agent as client identifier
    // This works for new clients without tokens
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}_${userAgent.slice(0, 50)}`;
}

function countRequest(req: Request, res: Response, next: NextFunction): void {
    const store = loadStore();
    const method = req.method.toUpperCase();
    const urlPath = req.path;

    // Update request counts
    store.requestCounts.totalRequests += 1;
    store.requestCounts.lastRequestAt = new Date().toISOString();

    if (method === 'GET') {
        store.requestCounts.getRequests += 1;
    } else if (method === 'POST') {
        store.requestCounts.postRequests += 1;
    }

    // Track specific endpoint types
    if (urlPath.includes('/view')) {
        store.requestCounts.viewRequests += 1;
    } else if (urlPath.includes('/like')) {
        store.requestCounts.likeRequests += 1;
    } else if (urlPath.includes('/comments') && !urlPath.includes('/resonate')) {
        store.requestCounts.commentRequests += 1;
    } else if (urlPath.includes('/resonate')) {
        store.requestCounts.resonateRequests += 1;
    }

    // Track unique clients (new clients without tokens included)
    const clientId = getClientIdentifier(req);
    if (!store.requestCounts.uniqueClients.includes(clientId)) {
        store.requestCounts.uniqueClients.push(clientId);
        // Keep only last 1000 unique clients to prevent file bloat
        if (store.requestCounts.uniqueClients.length > 1000) {
            store.requestCounts.uniqueClients = store.requestCounts.uniqueClients.slice(-1000);
        }
    }

    try {
        saveStore(store);
    } catch {
        // Storage unavailable - continue without counting
    }

    next();
}

// Apply request counting middleware to ALL routes
// No authentication required - endpoints are open for everyone
router.use(countRequest);

// ---- Endpoints ---------------------------------------------------------

// GET request counts (admin/analytics endpoint)
router.get('/stats', (_req: Request, res: Response) => {
    const store = loadStore();
    res.json({
        success: true,
        data: {
            requestCounts: {
                totalRequests: store.requestCounts.totalRequests,
                getRequests: store.requestCounts.getRequests,
                postRequests: store.requestCounts.postRequests,
                viewRequests: store.requestCounts.viewRequests,
                likeRequests: store.requestCounts.likeRequests,
                commentRequests: store.requestCounts.commentRequests,
                resonateRequests: store.requestCounts.resonateRequests,
                uniqueClientCount: store.requestCounts.uniqueClients.length,
                lastRequestAt: store.requestCounts.lastRequestAt,
            },
        },
    });
});

// Aggregate summary for every known post (used by the /blog index).
router.get('/', (_req: Request, res: Response) => {
    const store = loadStore();
    const out: Record<string, { views: number; likes: number; commentCount: number }> = {};
    for (const [slug, p] of Object.entries(store.posts)) {
        out[slug] = { views: p.views, likes: p.likes, commentCount: p.comments.length };
    }
    res.json({ success: true, data: out });
});

// Full engagement state for one post (views/likes/comments).
router.get('/:slug', (req: Request, res: Response) => {
    const store = loadStore();
    const post = getPost(store, slugOf(req));
    res.json({ success: true, data: { views: post.views, likes: post.likes, comments: post.comments } });
});

// Register one page view.
router.post('/:slug/view', (req: Request, res: Response) => {
    const store = loadStore();
    const post = getPost(store, slugOf(req));
    post.views += 1;
    try {
        saveStore(store);
    } catch {
        // storage unavailable -> keep in-memory count for this instance
    }
    res.json({ success: true, data: { views: post.views } });
});

// Like / unlike toggle.
router.post('/:slug/like', (req: Request, res: Response) => {
    const liked = !!(req.body && req.body.liked);
    const store = loadStore();
    const post = getPost(store, slugOf(req));
    post.likes = Math.max(0, post.likes + (liked ? 1 : -1));
    try {
        saveStore(store);
    } catch {
        // ignore
    }
    res.json({ success: true, data: { likes: post.likes, liked } });
});

// Add a comment.
router.post('/:slug/comments', (req: Request, res: Response) => {
    const name = String((req.body && req.body.name) || '').trim().slice(0, 60) || 'Anonymous';
    const text = String((req.body && req.body.text) || '').trim().slice(0, 2000);
    if (!text) {
        res.status(400).json({ success: false, message: 'Comment text is required' });
        return;
    }
    const store = loadStore();
    const post = getPost(store, slugOf(req));
    const comment: BlogComment = {
        id: 'c_' + crypto.randomBytes(6).toString('hex'),
        name,
        text,
        date: new Date().toISOString(),
        resonates: 0,
    };
    post.comments.unshift(comment);
    try {
        saveStore(store);
    } catch {
        // ignore
    }
    res.status(201).json({ success: true, data: { comments: post.comments } });
});

// Resonate (like) a comment.
router.post('/:slug/comments/:commentId/resonate', (req: Request, res: Response) => {
    const store = loadStore();
    const post = getPost(store, slugOf(req));
    const comment = post.comments.find((c) => c.id === req.params.commentId);
    if (!comment) {
        res.status(404).json({ success: false, message: 'Comment not found' });
        return;
    }
    comment.resonates = (comment.resonates || 0) + 1;
    try {
        saveStore(store);
    } catch {
        // ignore
    }
    res.json({ success: true, data: { resonates: comment.resonates } });
});

export default router;
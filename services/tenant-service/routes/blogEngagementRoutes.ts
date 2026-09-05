import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

/* =================================================================
   Blog Engagement API - views / likes / comments for Restpoint Journal
   Persisted in a simple JSON file so no extra database is needed.
   Default storage: /opt/storage/blog-data (the shared host bind mount,
   uid-1001 writable). Falls back to ./data, then the OS temp dir.
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

interface BlogStore {
    posts: Record<string, BlogPostData>;
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
                return parsed;
            }
        }
    } catch {
        // corrupted file -> reseed below
    }
    const store: BlogStore = { posts: {} };
    // Seed every known Journal post so first reads are never empty.
    const knownSlugs = [
        'future-of-death-care-software-restpoint',
        'bereavement-management',
        'member-contributions',
        'funeral-welfare-management',
    ];
    for (const slug of knownSlugs) {
        store.posts[slug] = seedPost(slug);
    }
    try {
        saveStore(store);
    } catch {
        // read-only filesystem -> serve from memory only
    }
    return store;
}

function getPost(store: BlogStore, slug: string): BlogPostData {
    if (!store.posts[slug]) {
        store.posts[slug] = seedPost(slug);
    }
    return store.posts[slug];
}

const slugOf = (req: Request): string =>
    String(req.params.slug || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '') || 'unknown';

// ---- Endpoints ---------------------------------------------------------

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

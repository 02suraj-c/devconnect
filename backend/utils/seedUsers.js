/**
 * Seed Script — Onboard ~200 Sample Developers + Posts
 *
 * Run with: npm run seed
 *
 * This script:
 *   1. Connects to MongoDB.
 *   2. Wipes existing users, posts, and messages (idempotent re-runs).
 *   3. Creates 200 developer accounts with Faker-generated profiles.
 *   4. Creates ~50 sample posts with tags and code snippets.
 *
 * All seeded accounts share the password "password123" so you can log
 * in as any of them during development / demos.
 *
 * NOTE: This destroys all existing data — never run in production.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User    = require('../models/User');
const Post    = require('../models/Post');
const Message = require('../models/Message');
const connectDB = require('../config/db');

// ── Skill pool to draw from ───────────────────────────────────────
const SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Svelte',
  'Node.js', 'Express', 'Python', 'Django', 'Flask', 'FastAPI',
  'Go', 'Rust', 'Java', 'Spring Boot', 'C#', '.NET', 'Ruby',
  'Rails', 'PHP', 'Laravel', 'Swift', 'Kotlin', 'Flutter', 'Dart',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform',
  'GraphQL', 'REST', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
  'Git', 'CI/CD', 'Linux', 'TailwindCSS', 'Next.js', 'Nuxt',
  'Prisma', 'Supabase', 'Firebase', 'Figma', 'WebSockets',
];

// ── Sample code snippets for posts ─────────────────────────────────
const CODE_SNIPPETS = [
  `// React custom hook for debounced search
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};`,

  `# Python decorator for retry logic
import time, functools

def retry(max_attempts=3, delay=1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(delay * (2 ** attempt))
        return wrapper
    return decorator`,

  `// Express rate-limiting middleware
const rateLimit = (windowMs, max) => {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const record = hits.get(key) || { count: 0, start: now };
    if (now - record.start > windowMs) {
      record.count = 0;
      record.start = now;
    }
    record.count++;
    hits.set(key, record);
    if (record.count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
};`,

  `-- PostgreSQL: find top contributors this month
SELECT
  u.name,
  COUNT(p.id) AS post_count,
  SUM(ARRAY_LENGTH(p.likes, 1)) AS total_likes
FROM users u
JOIN posts p ON p.author_id = u.id
WHERE p.created_at >= DATE_TRUNC('month', NOW())
GROUP BY u.id
ORDER BY total_likes DESC
LIMIT 10;`,

  `// Go: concurrent HTTP health checker
func checkHealth(urls []string) map[string]bool {
    results := make(map[string]bool)
    var mu sync.Mutex
    var wg sync.WaitGroup
    for _, url := range urls {
        wg.Add(1)
        go func(u string) {
            defer wg.Done()
            resp, err := http.Get(u)
            mu.Lock()
            results[u] = err == nil && resp.StatusCode == 200
            mu.Unlock()
        }(url)
    }
    wg.Wait()
    return results
}`,
];

// ── Post text templates ────────────────────────────────────────────
const POST_TEXTS = [
  "Just shipped a new feature using React Server Components — the DX improvement is incredible. Here's a snippet that helped me handle data fetching elegantly:",
  "TIL about this pattern for handling retries in distributed systems. Clean and extensible:",
  "Been exploring rate limiting strategies for our API. Here's a simple in-memory approach that works great for small-to-medium traffic:",
  "Optimised our database queries and reduced page load by 60%. This was the key query:",
  "Working on a health-check system for our microservices. Go's concurrency makes this so clean:",
  "What's everyone's preferred state management solution in 2024? I've been experimenting with Zustand and it's surprisingly ergonomic.",
  "Hot take: TypeScript's type inference has gotten good enough that you rarely need explicit type annotations anymore. Fight me.",
  "Just set up a full CI/CD pipeline with GitHub Actions. Automated testing + deploy on merge feels amazing.",
  "Contributing to open source this Hacktoberfest! Looking for beginner-friendly repos — any suggestions?",
  "Refactored our monolith into microservices over the past quarter. Lessons learned (thread):",
  "Docker Compose changed my local development workflow forever. No more 'works on my machine' issues.",
  "Finally understood why people love Rust's ownership model. Memory safety without a GC is *chef's kiss*.",
  "Built a real-time dashboard with WebSockets and it's been rock solid in production for 6 months.",
  "My favorite VS Code extensions for 2024 — what would you add to this list?",
  "Shout out to the MongoDB team for Atlas Search. Full-text search without running Elasticsearch? Yes please.",
];

// ── Helper: pick N random items from an array ──────────────────────
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// ── Main seed function ─────────────────────────────────────────────
async function seed(userCount = 200, postCount = 50) {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }

  console.log('🗑️   Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Message.deleteMany({}),
  ]);

  // ── Create users ──────────────────────────────────────────────────
  console.log(`👤  Creating ${userCount} sample users…`);
  const userDocs = [];
  for (let i = 0; i < userCount; i++) {
    const firstName = faker.person.firstName();
    const lastName  = faker.person.lastName();
    const name      = `${firstName} ${lastName}`;
    const email     = faker.internet.email({ firstName, lastName }).toLowerCase();

    userDocs.push({
      name,
      email,
      password: 'password123', // will be hashed by the pre-save hook
      bio: faker.person.bio(),
      skills: pickRandom(SKILLS, faker.number.int({ min: 2, max: 7 })),
      githubUrl: `https://github.com/${faker.internet.username({ firstName, lastName }).toLowerCase()}`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${faker.string.hexadecimal({ length: 6, prefix: '' })}&color=fff&size=128`,
    });
  }

  // Insert one-by-one so the pre-save password hash hook fires.
  // (insertMany bypasses Mongoose middleware.)
  const users = [];
  for (const doc of userDocs) {
    const user = await User.create(doc);
    users.push(user);
    if (users.length % 50 === 0) {
      console.log(`   … ${users.length} / 200 users created`);
    }
  }

  // ── Create sample posts ──────────────────────────────────────────
  console.log(`📝  Creating ${postCount} sample posts…`);
  const postDocs = [];
  for (let i = 0; i < postCount; i++) {
    const author    = users[faker.number.int({ min: 0, max: users.length - 1 })];
    const text      = POST_TEXTS[i % POST_TEXTS.length];
    const hasCode   = i < CODE_SNIPPETS.length || Math.random() > 0.6;
    const snippet   = hasCode
      ? CODE_SNIPPETS[i % CODE_SNIPPETS.length]
      : '';
    const tags      = pickRandom(SKILLS, faker.number.int({ min: 1, max: 4 }));

    // Random likes from other users.
    const likeCount = faker.number.int({ min: 0, max: 30 });
    const likers    = pickRandom(users, likeCount).map((u) => u._id);

    // Random comments.
    const commentCount = faker.number.int({ min: 0, max: 5 });
    const comments = Array.from({ length: commentCount }, () => ({
      user: users[faker.number.int({ min: 0, max: users.length - 1 })]._id,
      text: faker.lorem.sentence({ min: 4, max: 15 }),
    }));

    postDocs.push({
      author: author._id,
      text,
      codeSnippet: snippet,
      tags,
      likes: likers,
      comments,
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  await Post.insertMany(postDocs);

  console.log('');
  console.log('✅  Seed complete!');
  console.log(`    • ${users.length} users created`);
  console.log(`    • ${postDocs.length} posts created`);
  console.log('    • All passwords: "password123"');
  console.log('');

  return { users, posts: postDocs };
}

if (require.main === module) {
  connectDB().then(() => {
    seed()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
      });
  });
}

module.exports = seed;

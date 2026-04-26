# miniSocial — ft_transcendence

A full-stack social media web application built as part of the 42 School curriculum. Users can post content, follow each other, chat in real time, and interact through likes, comments, and hashtags — all within a secure, multi-language interface.

---

## Team Members & Roles

| Name | Login | Role |
|------|-------|------|
| Ayhan |  | Project Manager / Developer |
| Manuel | mhummel | Developer |
| Leon | ldick | Developer |
| Taha | tkirmizi | Product Owner / Developer |

---

## Project Management Approach

Work was organized using a **Git branching workflow** with feature branches merged into `master` via pull requests. Each team member worked on isolated features and submitted PRs for review before merging. Progress was tracked informally through PR descriptions and commit messages. Development followed an iterative approach: core infrastructure first (auth, database, Docker), then features layer by layer (posts, social graph, chat, UI polish, i18n).

---

## Technologies Used

| Technology | Purpose | Justification |
|---|---|---|
| **Next.js 15** (App Router) | Frontend framework | React-based CSR; file-based routing; built-in TypeScript support |
| **NestJS** | Backend framework | Modular, decorator-driven architecture; native TypeScript; easy JWT/guard integration |
| **PostgreSQL** | Relational database | ACID compliance; strong relational model for social graph (follows, likes, comments) |
| **Prisma ORM** | Database access layer | Type-safe queries; schema-as-code; auto-generated migrations |
| **Docker Compose** | Containerization | Reproducible multi-service environment (frontend, backend, db, pgAdmin) |
| **JWT** | Session management | Stateless auth; secure token-based access control |
| **TOTP / speakeasy** | Two-Factor Authentication | Industry-standard TOTP; compatible with Google Authenticator |
| **Google OAuth2** | Remote authentication | Allows sign-in with existing Google accounts; reduces password friction |
| **react-i18next** | Internationalization | Flexible i18n library with JSON locale files; supports RTL languages |
| **TypeScript** | Language | End-to-end type safety across frontend and backend |

---

## Database Schema

```
User
├── id, email (unique), username (unique)
├── passwordHash, avatarUrl, bio
├── twoFactorEnabled, twoFactorSecret
├── onlineStatus, lastSeen
├── language, role (user | admin)
├── posts[], likes[], comments[]
├── followers[], following[]   ← Follow relation
└── sentMessages[], receivedMessages[]

Post
├── id, content, createdAt
├── author → User (cascade delete)
├── files[], likes[], comments[]

File
├── id, filename, mimetype, size, data (Bytes)
├── author → User (cascade delete)
└── post → Post? (cascade delete)

Follow
├── followerId → User
└── followingId → User

Like
├── userId → User (cascade delete)
└── postId → Post (cascade delete)

Comment
├── id, content, createdAt
├── author → User (cascade delete)
└── post → Post (cascade delete)

Message
├── id, content, isRead, createdAt
├── sender → User (cascade delete)
└── receiver → User (cascade delete)
```

---

## Features

| Feature | Description | Implemented by |
|---|---|---|
| Signup / Login | Email + password auth with JWT cookie | Manuel |
| JWT Authentication | Stateless token-based session management | Manuel |
| Two-Factor Authentication | TOTP via QR code (Google Authenticator) | Leon |
| Google OAuth2 | Sign in with Google | Leon |
| User Profiles | Avatar upload, bio editing, follower/following counts | Ayhan |
| Follow / Unfollow | Social graph with follower/following lists | Taha |
| Post Creation | Text posts + image attachments (PNG/JPEG) | Taha / Leon / Ayhan |
| Post Feed | Chronological feed from followed users | Ayhan |
| Likes | Toggle like on posts with optimistic UI | Taha / Ayhan |
| Comments | Add and view comments per post | Taha / Ayhan |
| Explore Page | Discover posts from non-followed users | Ayhan |
| Real-Time Chat | Direct messages between users with online/offline status | Manuel / Ayhan |
| Unread Message Badge | Live unread count with 5-second polling | Ayhan |
| Hashtag Search | Search posts by `#hashtag`, users by `@username` | Ayhan |
| Trending Hashtags | Most-used hashtags surfaced in sidebar | Ayhan |
| Admin Panel | User management dashboard (admin role only) | Ayhan |
| Settings & UI | Language selection (EN/TR/DE/AR + RTL), 2FA toggle, account deletion, Privacy Policy/ToS modals, profile stats card | Ayhan |
| Responsive Layout | Adaptive sidebar layout for varying screen widths | Ayhan |
| Docker Setup | Full containerized dev environment | Ayhan / Manuel |

---

## Chosen Modules & Justifications

### Major Modules (2 point each)

| Module | Justification |
|---|---|
| **Standard User Management** | Profile editing, avatar upload (with default fallback), follow/unfollow with online status display, dedicated profile pages per user |
| **Advanced Permissions System** | Admin role with full user CRUD (view, edit role/avatar/bio, delete); post moderation; admin-only panel hidden from regular users |
| **WebSocket Real-Time Features** | Socket.io gateway with JWT auth; real-time message delivery, graceful connect/disconnect handling, direct socket targeting |
| **User Interaction** | Real-time chat between users; profile pages with avatar/bio/stats; follow/unfollow system with friends list |

### Minor Modules (1 point each)

| Module | Justification |
|---|---|
| **Multiple Language Support** | 4 complete translations (EN, TR, DE, AR) via react-i18next; language switcher in settings; all user-facing text translatable |
| **RTL Language Support** | Arabic (AR) with full RTL layout; seamless LTR↔RTL switching |
| **Frontend Framework** | React used for the entire frontend; component-based UI |
| **Backend Framework** | NestJS used for the entire backend; modular architecture with decorators and guards |
| **ORM** | Prisma ORM for all database access; type-safe queries, schema-as-code, auto-generated migrations |
| **File Upload & Management** | Image upload (PNG/JPEG) with server-side type and size validation (5MB limit); JWT-protected endpoints; ownership-checked file deletion; inline file serving |
| **Additional Browser Support** | Tested on Chrome and Firefox; all features functional in both; WebKit scrollbar styling not visible in Firefox (cosmetic only) |
| **2FA System** | TOTP-based 2FA via QR code (Google Authenticator compatible); enable/disable in settings; enforced on login when enabled |

### Total: **[4] major + [8] minor = [16] points**

---

## Browser Compatibility

| Browser | Tested | Notes |
|---|---|---|
| Chrome 120+ | ✓ | Full support |
| Firefox 121+ | ✓ | Custom scrollbar styling not applied (cosmetic only); all features functional |

### Known Limitations
- `*::-webkit-scrollbar` CSS is Chrome/Edge/Safari only — Firefox shows the default system scrollbar instead.

---

## Individual Contributions

### Ayhan — Project Manager / Developer
- Designed and built the entire frontend architecture (Next.js App Router, component library, CSS design system)
- Implemented home feed, explore page, search, profile pages, messages UI, settings page, admin panel
- Built social features: post composer, like/comment UI, follow modals, trending hashtags
- Added multi-language support (react-i18next) with 4 locales and Arabic RTL text direction
- Integrated all frontend pages with the backend REST API

### Manuel — Developer
- Implemented JWT-based signup and login (backend + frontend connection)
- Built the real-time chat system backend and initial frontend
- Set up the initial NestJS project structure and auth guards
- Wrote initial README and infrastructure documentation

### Leon — Developer
- Implemented Two-Factor Authentication (TOTP, QR code generation, verification endpoint)
- Integrated Google OAuth2
- Built image/file upload backend endpoints and database model
- Added attachment UI to the post composer

### Taha — Product Owner / Developer
- Built posts, likes, and comments backend (controllers, services, DTOs)
- Implemented follow/unfollow system with follower/following endpoints
- Designed and maintained Prisma seed data
- Added user search and user listing endpoints

---

## Running the Project

```bash
# 1. Generate SSL certificates
bash generate-certs.sh

# 2. Copy environment variables
cp .env.example .env

# 3. Start all services
docker compose up --build

# Frontend: http://localhost:3001
# Backend:  https://localhost:3000
# pgAdmin:  http://localhost:5050
```

> **Note:** The backend uses a self-signed certificate. On first visit to `https://localhost:3000`, browsers will show a security warning — click "Advanced → Proceed" to continue.

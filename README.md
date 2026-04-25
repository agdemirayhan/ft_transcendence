# miniSocial — ft_transcendence

A full-stack social media web application built as part of the 42 School curriculum. Users can post content, follow each other, chat in real time, and interact through likes, comments, and hashtags — all within a secure, multi-language interface.

---

## Team Members & Roles

| Name | Login | Role |
|------|-------|------|
| Ayhan | aagdemir | Project Manager / Developer |
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
| Two-Factor Authentication | TOTP via QR code (Google Authenticator) | Leon Dick |
| Google OAuth2 | Sign in with Google | Leon Dick |
| User Profiles | Avatar upload, bio editing, follower/following counts | Ayhan Agdemir |
| Follow / Unfollow | Social graph with follower/following lists | Taha Kirmizi |
| Post Creation | Text posts + image attachments (PNG/JPEG) | Taha Kirmizi / Leon Dick |
| Post Feed | Chronological feed from followed users | Ayhan Agdemir |
| Likes | Toggle like on posts with optimistic UI | Taha Kirmizi / Ayhan Agdemir |
| Comments | Add and view comments per post | Taha Kirmizi / Ayhan Agdemir |
| Explore Page | Discover posts from non-followed users | Ayhan Agdemir |
| Real-Time Chat | Direct messages between users with online/offline status | Manuel / Ayhan Agdemir |
| Unread Message Badge | Live unread count with 5-second polling | Ayhan Agdemir |
| Hashtag Search | Search posts by `#hashtag`, users by `@username` | Ayhan Agdemir |
| Trending Hashtags | Most-used hashtags surfaced in sidebar | Ayhan Agdemir |
| Admin Panel | User management dashboard (admin role only) | Ayhan Agdemir |
| Settings Page | Language selection, 2FA toggle, account deletion | Ayhan Agdemir |
| Multi-Language UI | English, Turkish, German, Arabic (with RTL text support) | Ayhan Agdemir |
| Privacy Policy / ToS | Modal dialogs on the auth page | Ayhan Agdemir |
| Profile Card | Summary card with stats on home page | Ayhan Agdemir |
| Responsive Layout | Adaptive sidebar layout for varying screen widths | Ayhan Agdemir |
| Docker Setup | Full containerized dev environment | Ayhan Agdemir / Manuel |

---

## Chosen Modules & Justifications -- Needs to be revised

### Major Modules (2 point each)

| Module | Justification |
|---|---|
| **Standard User Management** | Full user lifecycle: registration, profile editing, avatar upload, follow/unfollow, stats display |
| **Two-Factor Authentication (2FA) + JWT** | TOTP-based 2FA with QR code setup; JWT for all protected endpoints |
| **Remote Authentication (OAuth2)** | Google OAuth2 integration for frictionless login |
| **Live Chat** | Real-time direct messaging with online status, read receipts, and message sorting |

### Minor Modules (1 points each)

| Module | Justification |
|---|---|
| **Multiple Language Support** | 4 languages (EN, TR, DE, AR); Arabic includes RTL text direction |
| **Server-Side Rendering** | Next.js App Router provides SSR for initial page loads; improves performance and SEO |

### Total: **[X] major + [X] minor = [X] points**

---

## Individual Contributions

### Ayhan Agdemir — Project Manager / Developer
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

### Leon Dick — Developer
- Implemented Two-Factor Authentication (TOTP, QR code generation, verification endpoint)
- Integrated Google OAuth2
- Built image/file upload backend endpoints and database model
- Added attachment UI to the post composer

### Taha Kirmizi — Product Owner / Developer
- Built posts, likes, and comments backend (controllers, services, DTOs)
- Implemented follow/unfollow system with follower/following endpoints
- Designed and maintained Prisma seed data
- Added user search and user listing endpoints

---

## Running the Project

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Start all services
docker compose up --build

# Frontend: http://localhost:3001
# Backend:  http://localhost:3000
# pgAdmin:  http://localhost:5050
```

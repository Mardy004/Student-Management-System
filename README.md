## README Contents
1. #feature-overview
2. #prerequisites
3. #firebase-project-setup
4. #setup
5. #deploying-firestore-rules--indexes
6. #project-structure
7. #--data-model
8. #authentication--authorization

## Feature overview

Students can:
- Register / log in (email+password or Google)
- View dashboard: active lessons, attendance, upcoming lessons, recent notifications, recent marks
- View full attendance history
- View calendar of lessons and permission
- Submit permission requests (date/lesson, reason, details)
- View marks and teacher feedback, by subject
- View notifications (permission, new marks, lesson)

Teachers can:
- Register / log in (email+password or Google)
- View all students with attendance
- Create, edit, and delete lessons (title, description, date/time, location, link, resources)
- Mark attendance per lesson (present / absent)
- Review pending permission requests and approve/deny them
- Add marks and written feedback per student/subject
- View a dashboard (pending requests, upcoming lessons)

## Prerequisites

- **Node.js** 18.18+ (Next.js 14 requirement) ; `node -v`
- **npm**
- A free Firebase account (Google account)
- (recommended) the **Firebase CLI** ; `npm install -g firebase-tools`

## Firebase project setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and
   click **Add project**. Name it anything (i.e. `classlink`). Google Analytics for this project isn't used.

2. **Register a Web App**: on the project overview page, click the `</>`
   (web) icon. Give it a name (i.e. `classlink-web`). You do not need Firebase Hosting at this step. After registering, Firebase shows you
   a `firebaseConfig` object ; copy those values, and paste them into
   `.env.local` in the next section.

3. **Enable Authentication**:
   - In the left sidebar, go to **Build → Authentication → Get started**.
   - Under **Sign-in method**, enable **Email/Password**.
   - Also enable **Google** as a sign-in provider (pick a support email when prompted).

4. **Create a Firestore database**:
   - Go to **Build → Firestore Database → Create database**.
   - Choose a location close to you (can't be changed later).
   - Start in **production mode** (If you start in test mode instead, deploying `firestore.rules` as described later will still lock it down properly).

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Create local environment file
cp .env.local.example .env.local
```

Open `.env.local` and paste in the values from Firebase web app config
(Step 2 above):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Deploying Firestore rules & indexes

The app will **not work correctly** ; reads/writes will be rejected ; until you deploy `firestore.rules`. By default, a fresh Firestore database in production mode denies all reads/writes.

```bash
# One-time setup
firebase login
firebase init firestore

# Deploy
firebase deploy --only firestore:rules,firestore:indexes
```

Alternatively, you can paste the contents of `firestore.rules` directly into **Firestore Database → Rules** in the
Firebase Console and click **Publish** ; no CLI needed.

## Project structure

```                           
src/
  app/
    layout.tsx              # fonts, AuthProvider
    page.tsx                # Landing/Welcome page
    globals.css              # Tailwind directives and component classes
    login/page.tsx
    register/page.tsx
    student/
      layout.tsx             # Route(role="student")
      page.tsx                # Overview
      attendance/page.tsx
      calendar/page.tsx
      permissions/page.tsx
      marks/page.tsx
      notifications/page.tsx
    teacher/
      layout.tsx             # Route(role="teacher")     
      page.tsx                # Overview
      lessons/page.tsx        # List / delete
      lessons/new/page.tsx
      lessons/[id]/page.tsx   # Edit
      attendance/page.tsx     # Mark attendance per lesson
      permissions/page.tsx    # Approve/deny
      marks/page.tsx          # Add marks/feedback
      students/page.tsx       # Roster with stats
  components/
    ProtectedRoute.tsx        # Auth + role
    DashboardShell.tsx        # Sidebar/topbar nav shared by both roles
    LessonForm.tsx             # Shared create/edit lesson form
    StatusBadge.tsx
    LoadingSpinner.tsx
  context/
    AuthContext.tsx            # Combines Firebase Auth <-> Firestore profile
  lib/
    firebase.ts                 # Firebase app/service init
    firestore.ts                 # All Firestore reads/writes live here
  types/
    index.ts                     # Shared TypeScript types for every collection
firestore.rules               # Server-side authorization
firestore.indexes.json        # indexes the app's queries
firebase.json                 # Points the Firebase CLI at the two files above
```

## Architecture & data model

Firestore collections (see
`src/types/index.ts` for full field definitions):

| Collection | Purpose | Key fields |
| `users` | Profile/role, separate from Firebase Auth's own record | `uid`, `role`, `fullName`, `email` |
| `lessons` | Created by teachers | `teacherId`, `date`, `studentIds` (empty = visible to all) |
| `attendance` | One doc per (student, lesson) | `studentId`, `teacherId`, `lessonId`, `status` |
| `permissionRequests` | Submitted by students | `studentId`, `teacherId`, `lessonId`, `status` |
| `marks` | Added by teachers | `studentId`, `teacherId`, `subject`, `score`/`maxScore` |
| `notifications` | generated per recipient | `userId`, `type`, `read` |


## Authentication vs. authorization

- **Authentication** ; *"Who is this?"* **Firebase Auth**. It verifies an email+password pair or a Google identity and gives the app a signed session. The app never sees or stores a password ; Firebase's servers do that hashing and verification.

- **Authorization** ; *"What are they allowed to do?"* This is **not**
  Firebase Auth's job. It's answered by:
  1. The `role` field in each user's `users/{uid}` Firestore document
     (`"student"` or `"teacher"`).
  2. `firestore.rules`, which reads that same `role` field server-side and
     decides what each request may read or write.
  3. `ProtectedRoute` + the `/student` and `/teacher` route groups on the
     client, which redirect based on role.

**How does the app know if a logged-in user is a student or teacher?**
`AuthContext` (`src/context/AuthContext.tsx`) listens to Firebase Auth's
`onAuthStateChanged`. Whenever that fires with a signed-in user, it fetches
`users/{uid}` from Firestore and stores the result as `profile`. Every page
under `/student` or `/teacher` is wrapped in `<ProtectedRoute
allowedRole="...">`, which checks `profile.role` and redirects if it
doesn't match.

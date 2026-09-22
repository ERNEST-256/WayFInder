WayFinder 1.0 — Backend Architecture

1. Purpose

This document defines the backend architecture for WayFinder 1.0.

The architecture is designed around four principles:

1. Fast and reliable core platform
2. Trip Lead has final control
3. Collaborative planning without unnecessary real-time complexity
4. AI is isolated so WayFinder 2.0 can introduce a deeper intelligence layer without redesigning the core backend

⸻

2. High-Level Architecture

                         INTERNET
                            │
                            ▼
                         NGINX
                            │
                            ▼
                      API Gateway
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      Auth Service     User Service      Trip Service
                                              │
                    ┌─────────────────────────┤
                    │                         │
                    ▼                         ▼
             Planning Service        Collaboration Service
                    │                         │
                    │                         │
                    └──────────┬──────────────┘
                               │
                               ▼
                         PostgreSQL
                              
       ┌─────────────────────────────────────────────┐
       │                                             │
       ▼                                             ▼
Recommendation Service                    Travel Status Service
       │                                             │
       ▼                                             ▼
    MongoDB                                      MongoDB
                         Redis
                           │
                         BullMQ
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        AI Worker    Notification     Status Worker
                         Worker

The exact physical deployment can evolve, but these are the logical responsibilities of the backend.

⸻

3. Backend Technology

Component	Technology
Runtime	Node.js
Language	TypeScript
API	REST
Primary database	PostgreSQL
AI/flexible data store	MongoDB
Cache	Redis
Job queue	BullMQ
Reverse proxy	NGINX
Containers	Docker
CI/CD	GitHub Actions

⸻

4. Core Architecture Rule

Services communicate through APIs and asynchronous events/jobs.

A service must not directly access another service’s database.

Service A
   │
   │ API / Event
   ▼
Service B
   │
   ▼
Service B's database

Never:

Service A ───────► Service B's DB

Each service owns its data.

⸻

5. Services

5.1 API Gateway

The API Gateway is the public backend entry point.

Responsibilities:

* Route requests
* Authentication middleware
* Authorization checks
* Request validation
* Rate limiting
* Request/correlation IDs
* Consistent error responses

The gateway contains no business logic.

Client
  ↓
NGINX
  ↓
API Gateway
  ↓
Internal Services

⸻

6. Auth Service

Handles authentication for Trip Leads.

Responsibilities:

* Signup
* Login
* Email verification
* Password reset
* Session/token management
* Account security

Authentication data is stored in PostgreSQL.

Members do not require full WayFinder accounts.

⸻

7. User Service

Owns the authenticated user’s application profile.

Responsibilities:

* Profile
* User preferences
* Account settings

The service exposes relevant information to other services through APIs.

The AI system may consume user preferences later, but does not own them.

⸻

8. Trip Service

The Trip Service is the core business service.

Responsibilities:

* Create trip
* Update trip
* Trip lifecycle
* Trip Lead
* Trip members
* Member roles
* Trip permissions
* Trip completion
* Trip expiration

Every collaborative operation is scoped to a trip_id.

Trip
 ├── Lead
 ├── Members
 ├── Itinerary
 ├── Suggestions
 ├── Bookings
 ├── Notifications
 └── Timeline

8A. Trip Membership & Invitation

WayFinder uses two identity levels:

* Trip Lead → full authenticated WayFinder user
* Trip Member → lightweight identity scoped to a specific trip

A member does not need a full WayFinder account.

⸻

8A.1 Trip Ownership

When an authenticated user creates a trip:

User
 │
 └── creates
       │
       ▼
     Trip
       │
       └── lead_user_id

Example:

trips
----------------
id
lead_user_id
name
status
created_at
...

The lead_user_id identifies the authenticated Trip Lead.

⸻

8A.2 Trip Invite

The Lead can generate an invitation for a member.

trip_invites
----------------
id
trip_id
token_hash
created_by
expires_at
max_uses
status
created_at

The generated invitation produces a link such as:

https://wayfinder.app/join/<invite-token>

The raw token is sent through the link, but only its hash is stored in the database.

This prevents a database leak from exposing usable invitation tokens.

⸻

8A.3 Joining a Trip

The member opens the invitation link and provides:

Name
Email

The backend validates the invitation token and creates a Trip Member.

POST /trip-invites/{token}/join

Example request:

{
  "name": "Rahul",
  "email": "rahul@example.com"
}

⸻

8A.4 Trip Member

A Trip Member is an identity that exists within one specific trip.

trip_members
----------------
id
trip_id
name
email
role
status
joined_at
expires_at

Example:

trip_id   → T123
member_id → M456
name      → Rahul
email     → rahul@example.com
role      → MEMBER
status    → ACTIVE

The relationship is:

Trip
 │
 ├── Lead → authenticated User
 │
 ├── Member → TripMember
 ├── Member → TripMember
 └── Member → TripMember

A member is therefore not a global WayFinder user.

They are a participant in a specific trip.

⸻

8A.5 Trip Member Session

After successfully joining, the backend creates a lightweight session for the member.

Join Link
    ↓
Name + Email
    ↓
Invite Validation
    ↓
TripMember created
    ↓
Member Session created
    ↓
Secure HttpOnly session cookie

The session resolves to:

member_id
trip_id
role

Subsequent requests therefore do not require the member to repeatedly enter their name or email.

The session is temporary and follows the trip/member retention policy.

⸻

8A.6 Authorization

Every member request is evaluated using:

Session
   ↓
member_id
   ↓
trip_id
   ↓
role
   ↓
permission

Example:

POST /trips/T123/suggestions

The backend checks:

Member belongs to T123?
        ↓
       YES
        ↓
Trip is ACTIVE?
        ↓
       YES
        ↓
MEMBER can create suggestions?
        ↓
       YES

An attempt to modify the itinerary directly:

POST /trips/T123/itinerary

is rejected because TRIP_MEMBER does not have that permission.

Authorization is enforced server-side.

⸻

8A.7 Collaboration Data

Suggestions are linked directly to both the trip and the member.

suggestions
----------------
id
trip_id
member_id
target_item_id
message
proposed_change
status
created_at
resolved_at
resolved_by

This produces a simple relationship:

Trip T123
 │
 ├── Member M1
 │     └── Suggestion S1
 │
 ├── Member M2
 │     └── Suggestion S2
 │
 └── Lead U1

All collaboration operations are therefore naturally scoped by trip_id.

⸻

8A.8 Invitation Lifecycle

INVITE CREATED
      │
      ▼
    ACTIVE
      │
 ┌────┴───────────┐
 ▼                ▼
Member joins     Expires
 │                │
 ▼                ▼
Membership       INVALID
created

For the initial implementation, invitations should be individually generated for members.

This gives the Lead control over exactly who joins the trip.

⸻

8A.9 Trip Collaboration Boundary

The trip_id is the root identifier for the collaboration system.

Trip ID
  │
  ├── Lead
  ├── Members
  ├── Member Sessions
  ├── Suggestions
  ├── Messages
  ├── Approvals
  ├── Itinerary
  ├── Timeline
  └── Notifications

This allows the backend to consistently answer:

Who is this person, which trip are they accessing, and what are they allowed to do within that trip?

⸻

8A.10 Trip Completion

When a trip is completed:

ACTIVE
   ↓
COMPLETED
   ↓
READ-ONLY

Members can continue viewing the trip according to the retention policy, but:

* No new suggestions
* No itinerary changes
* No approvals
* No new collaboration actions
* No AI modifications

Temporary member sessions and collaboration data can subsequently expire through TTL/retention policies.

Permanent trip history remains part of the canonical trip record.
⸻

9. Planning Service

Owns the official itinerary.

Responsibilities:

* Create itinerary
* Modify itinerary
* Validate itinerary changes
* Itinerary versioning
* Apply approved changes
* Maintain itinerary history

The Planning Service is the only service that applies changes to the official itinerary.

The AI cannot directly modify the itinerary.

AI proposal
    ↓
Lead approval
    ↓
Planning Service
    ↓
Validation
    ↓
PostgreSQL

⸻

10. Collaboration Service

Handles member interaction with the Lead.

Members do not directly edit the itinerary.

Instead, they submit suggestions.

Example:

Member:
"Can we move the museum visit to Sunday?"

The Collaboration Service stores the suggestion.

Suggestion
├── trip_id
├── member_id
├── target
├── proposed_change
├── message
├── status
└── timestamps

Possible states:

PENDING
APPROVED
REJECTED
WITHDRAWN

⸻

11. Collaborative Planning Flow

Member
  │
  ▼
Suggest Change
  │
  ▼
Collaboration Service
  │
  ▼
Suggestion stored
  │
  ▼
Lead sees suggestion
  │
  ├───────────────┐
  ▼               ▼
Reject          Approve
  │               │
  ▼               ▼
Lead response   AI review
                    │
             ┌──────┴──────┐
             ▼             ▼
          Conflict       Valid
             │             │
             ▼             ▼
        Warn Lead     Planning Service
                           │
                           ▼
                    Update itinerary
                           │
                    Create new version
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
          Timeline                 Notification

⸻

12. AI Access Boundary

AI is a Lead-only capability.

Members cannot directly interact with the AI system.

TRIP_LEAD
    │
    └── AI access ✅
TRIP_MEMBER
    │
    └── AI access ❌

The restriction is enforced by the backend authorization layer, not merely by hiding UI elements.

⸻

13. AI Review of Approved Changes

When the Lead approves a member suggestion:

Lead approves
      ↓
AI review
      ↓
Check current trip context
      ↓
Check itinerary constraints
      ↓
Check for conflicts

Conflict

AI informs the Lead:

The proposed change conflicts with the current itinerary.

No modification is made.

No conflict

AI validation
      ↓
Planning Service
      ↓
Apply change
      ↓
Create new itinerary version

The AI never bypasses the Lead.

⸻

14. Member Experience

Members have a lightweight trip-scoped identity.

They join using a Lead-generated link.

Join link
    ↓
Enter name + email
    ↓
Create trip member
    ↓
Access trip

Members do not complete the full authentication flow.

Email is collected because notifications are delivered through email.

⸻

15. Member Dashboard

Members can access:

* Current itinerary
* Booking/recommendation links shared by the Lead
* Transportation status if configured by the Lead
* Change timeline
* Suggestion interface
* Lead responses
* Estimated bill split if shared by the Lead

Members cannot:

* Use AI
* Edit itinerary
* Approve changes
* Reject suggestions
* Manage members
* Modify trip configuration

⸻

16. Lead Dashboard

The Lead has access to all trip functionality:

* Itinerary
* AI planning
* Recommendations
* Booking information
* Transportation tracking
* Suggestions
* Approvals
* Timeline
* Member management
* Member communication
* Estimated bill split

⸻

17. Estimated Bill Split

The Lead may optionally ask AI to generate an estimated bill split.

Lead
  ↓
AI generates estimate
  ↓
Lead reviews
  ↓
Lead optionally adds note
  ↓
Lead shares
  ↓
Members can view

The bill split is an estimate, not a payment or accounting system.

WayFinder 1.0 does not include payment processing or full expense management.

⸻

18. Recommendation Service

Handles external travel information.

Responsibilities:

* Flight recommendations
* Train recommendations
* Hotel recommendations
* Attraction information
* Ticket links
* External provider integrations

Flexible provider responses and recommendation artifacts are stored in MongoDB.

Once the Lead confirms a selection, the canonical user-facing state belongs in PostgreSQL.

⸻

19. Travel Status Service

Handles transportation tracking when the Lead provides supported booking/PNR information.

Flow:

Lead provides PNR
       ↓
Travel Status Service
       ↓
External provider
       ↓
Status received
       ↓
MongoDB
       ↓
Relevant canonical status
       ↓
Notification

Members can only view the resulting status.

They cannot configure tracking.

⸻

20. Notification Service

Handles:

* Email notifications
* Trip updates
* Suggestion responses
* Approved itinerary changes
* Travel-status alerts
* Reminders

Notifications should be processed asynchronously.

Service
  ↓
BullMQ
  ↓
Notification Worker
  ↓
Email provider

A slow email provider should never block the main API request.

⸻

21. Trip Timeline

The timeline records meaningful trip changes.

Examples:

Trip created
Itinerary generated
Hotel selected
Member suggested itinerary change
Lead rejected suggestion
Lead approved suggestion
Itinerary updated
Transportation status changed

Each event should contain enough information to answer:

* What happened?
* When?
* Who initiated it?
* Who approved it?
* What changed?

The timeline is part of the permanent trip history and is stored in PostgreSQL.

⸻

22. Trip Lifecycle

ACTIVE
   │
   │ trip ends
   ▼
COMPLETED
   │
   ▼
READ-ONLY
   │
   │ retention period
   ▼
EXPIRED

ACTIVE

Normal collaboration is available.

COMPLETED

The trip becomes read-only.

No:

* New suggestions
* Itinerary modifications
* Approvals
* AI changes
* New collaboration actions

EXPIRED

Temporary collaboration/member data can be removed according to its TTL policy.

Permanent historical data follows the application’s retention policy.

⸻

23. Data Architecture

PostgreSQL

PostgreSQL is the source of truth for canonical application state.

Stores:

* Users
* Authentication
* Trips
* Trip members
* Roles
* User preferences
* Official itinerary
* Itinerary versions
* Suggestions
* Approvals
* Confirmed bookings
* Notifications
* Timeline
* Confirmed transportation information

Rule:

If it represents confirmed user/application state, PostgreSQL owns it.

⸻

MongoDB

MongoDB is the AI/flexible-data layer.

Stores:

* AI-generated proposals
* Recommendations
* External provider responses
* Temporary planning context
* AI observations
* AI-derived insights
* AI interaction artifacts

MongoDB data is disposable by default.

It must not become a second source of truth for the trip.

⸻

24. MongoDB Retention

Temporary AI data uses TTL.

Example:

Raw recommendation
        ↓
Short TTL
        ↓
Automatic deletion

AI observations can have a longer window:

AI observation
      ↓
30-day retention
      ↓
Insight Processor
      ↓
Useful → compact insight
Not useful → delete

Useful insights should be stored in a compact form rather than retaining large raw documents indefinitely.

AI-derived insights do not automatically become canonical user preferences.

⸻

25. Redis

Redis is used for ephemeral infrastructure state.

Responsibilities:

* BullMQ queues
* Caching
* Rate limiting
* Short-lived state
* Job coordination

Redis is never the source of truth.

⸻

26. Asynchronous Processing

Long-running or failure-prone work uses BullMQ.

API
 │
 ▼
Redis / BullMQ
 │
 ├── AI Worker
 ├── Recommendation Worker
 ├── Notification Worker
 └── Travel Status Worker

Examples:

* AI itinerary generation
* AI itinerary review
* Recommendation retrieval
* Email delivery
* Travel-status polling
* Reminder scheduling

Normal CRUD operations remain synchronous.

⸻

27. AI 2.0 Extension Point

WayFinder 1.0 does not depend on advanced AI.

The backend exposes an isolated AI boundary:

Core Services
      │
      ▼
   AI Service
      │
      ▼
 Model Gateway
      │
      ▼
Self-hosted LLM

The underlying model and inference infrastructure can be replaced without modifying the core trip system.

WayFinder 2.0 can later introduce:

* Better context management
* Retrieval
* Long-term AI memory
* Group preference reasoning
* Constraint reasoning
* Tool calling
* Advanced planning
* Dynamic replanning
* Personalization

The core services remain unchanged.

⸻

28. Authorization Model

Every request is evaluated against:

Authenticated identity
        ↓
Trip ID
        ↓
Role
        ↓
Permission

Primary roles:

TRIP_LEAD
TRIP_MEMBER

Example:

POST /trips/:tripId/ai/...
→ TRIP_LEAD only
POST /trips/:tripId/suggestions
→ TRIP_MEMBER
POST /trips/:tripId/itinerary/approve
→ TRIP_LEAD
GET /trips/:tripId/itinerary
→ TRIP_LEAD or TRIP_MEMBER

Authorization must happen server-side.

⸻

29. Concurrency Control

Itinerary modifications use versioning/optimistic concurrency.

Example:

Lead reviewing version 7
Current itinerary → version 8
Lead approves suggestion based on version 7

The backend detects the version mismatch.

The change must be revalidated before being applied.

This prevents an outdated suggestion from silently overwriting newer itinerary changes.

⸻

30. Backend Reliability Requirements

Every service should implement:

* Request validation
* Timeouts
* Controlled retries
* Exponential backoff where appropriate
* Idempotency for retryable operations
* Health checks
* Graceful failure
* Structured errors
* Correlation IDs

Workers should support:

* Retry
* Backoff
* Failure tracking
* Dead-letter handling
* Controlled concurrency

⸻

31. Deployment

Initial production architecture:

AWS
│
├── EC2
│   ├── NGINX
│   ├── Backend services
│   ├── Workers
│   └── Redis
│
├── RDS PostgreSQL
│
├── MongoDB
│
├── S3
│
├── ECR
│
└── CloudWatch

Docker is used to package services.

GitHub Actions handles:

Push
 ↓
Lint
 ↓
Tests
 ↓
Security checks
 ↓
Docker build
 ↓
Image registry
 ↓
Deployment

The exact GPU infrastructure for the AI service remains replaceable.

⸻

32. Backend Architectural Principles

1. PostgreSQL is truth

Confirmed application state belongs in PostgreSQL.

2. MongoDB is disposable AI space

AI-generated and external flexible data should not become permanent application truth by accident.

3. Lead has final authority

AI and members can propose. The Lead decides.

4. Members are lightweight

Members participate through the trip rather than becoming full WayFinder accounts.

5. Trip ID is the collaboration boundary

All member interaction, permissions, suggestions and trip activity are scoped to the trip.

6. AI is isolated

The core backend must remain functional without the advanced AI system.

7. Async work stays off the request path

Slow external calls and AI workloads go through workers.

8. No unnecessary real-time complexity

WayFinder 1.0 does not require Google Docs-style collaborative editing, CRDTs, or complex WebSocket synchronization.

9. No cross-service database access

Services communicate through APIs/events.

10. Completed trips become immutable

Once a trip is completed, it becomes a read-only historical record.

⸻

33. 1.0 Backend Goal

The goal of this architecture is not to maximize the number of services.

The goal is:

A fast, reliable collaborative trip platform where the Trip Lead controls the official trip state, members can contribute without creating unnecessary complexity, and the architecture leaves a clean extension point for WayFinder 2.0’s intelligence layer.
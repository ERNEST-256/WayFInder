WayFinder 1.0 — API Design

1. API Principles

* REST API
* JSON request/response bodies
* Versioned under /api/v1
* Authentication handled through secure sessions/tokens
* Authorization enforced server-side
* trip_id is the collaboration boundary
* Long-running work is asynchronous
* API responses return job/status information rather than blocking on AI/external work
* Services do not expose their databases directly

Base URL:

/api/v1

⸻

2. Authentication

Authentication applies to full WayFinder users, primarily Trip Leads.

Signup

POST /auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "..."
}

Response:

{
  "message": "Verification email sent"
}

⸻

Verify Email

POST /auth/verify-email
{
  "token": "verification-token"
}

⸻

Login

POST /auth/login
{
  "email": "john@example.com",
  "password": "..."
}

Creates an authenticated session.

⸻

Logout

POST /auth/logout

⸻

Refresh Session

POST /auth/refresh

⸻

Password Reset

POST /auth/forgot-password
{
  "email": "john@example.com"
}
POST /auth/reset-password
{
  "token": "reset-token",
  "password": "..."
}

⸻

3. User API

Get Profile

GET /users/me

Response:

{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com"
}

⸻

Update Profile

PATCH /users/me
{
  "name": "John Doe"
}

⸻

Get Preferences

GET /users/me/preferences

⸻

Update Preferences

PATCH /users/me/preferences

⸻

4. Trip API

Create Trip

POST /trips
{
  "name": "Goa Trip",
  "destination": "Goa",
  "start_date": "2026-12-10",
  "end_date": "2026-12-14"
}

The authenticated user automatically becomes the Trip Lead.

Response:

{
  "trip_id": "trip-123",
  "role": "TRIP_LEAD",
  "status": "ACTIVE"
}

⸻

Get Trip

GET /trips/{tripId}

⸻

Update Trip

PATCH /trips/{tripId}

Only the Lead can modify trip configuration.

⸻

Complete Trip

POST /trips/{tripId}/complete

Changes the trip to a read-only state.

⸻

5. Trip Member API

Create Invite

POST /trips/{tripId}/invites

Lead only.

Response:

{
  "invite_id": "invite-123",
  "invite_link": "https://wayfinder.app/join/...",
  "expires_at": "..."
}

The actual invite token is random and high entropy.

⸻

Validate Invite

GET /trip-invites/{token}

Returns basic information required to display the join page.

Example:

{
  "valid": true,
  "trip_name": "Goa Trip"
}

No private trip information is exposed.

⸻

Join Trip

POST /trip-invites/{token}/join
{
  "name": "Rahul",
  "email": "rahul@example.com"
}

Creates a Trip Member and member session.

Response:

{
  "member_id": "member-123",
  "trip_id": "trip-123",
  "role": "TRIP_MEMBER"
}

⸻

Get Trip Members

GET /trips/{tripId}/members

Lead only.

⸻

Remove Member

DELETE /trips/{tripId}/members/{memberId}

Lead only.

⸻

6. Trip Access

Get Member Trip View

GET /trips/{tripId}/view

Accessible by Lead and Members.

The response is filtered according to the caller’s role.

A Member receives only the information they are permitted to view.

⸻

7. Itinerary API

Get Current Itinerary

GET /trips/{tripId}/itinerary

Lead and Members.

⸻

Get Itinerary Version

GET /trips/{tripId}/itinerary/versions/{versionId}

Lead and Members.

⸻

Create/Modify Itinerary

PATCH /trips/{tripId}/itinerary

Lead only.

The Planning Service validates the modification and creates a new itinerary version.

Example:

{
  "changes": [
    {
      "item_id": "item-123",
      "operation": "MOVE",
      "date": "2026-12-12",
      "start_time": "15:00"
    }
  ]
}

⸻

8. Suggestion API

Members cannot modify the official itinerary directly.

Create Suggestion

POST /trips/{tripId}/suggestions

Member only.

{
  "target_item_id": "item-123",
  "message": "Can we move this to Sunday?",
  "proposed_change": {
    "operation": "MOVE",
    "target_date": "2026-12-13"
  }
}

Response:

{
  "suggestion_id": "suggestion-123",
  "status": "PENDING"
}

⸻

Get Suggestions

GET /trips/{tripId}/suggestions

Lead receives the suggestion management view.

Members receive only their permitted suggestion/response information.

⸻

Get Suggestion

GET /trips/{tripId}/suggestions/{suggestionId}

⸻

Reject Suggestion

POST /trips/{tripId}/suggestions/{suggestionId}/reject

Lead only.

{
  "message": "We'll keep the current plan because Sunday is already full."
}

The rejection message is delivered to the member.

⸻

Approve Suggestion

POST /trips/{tripId}/suggestions/{suggestionId}/approve

Lead only.

This does not immediately modify the itinerary.

It triggers AI review.

Response:

{
  "suggestion_id": "suggestion-123",
  "status": "AI_REVIEW_PENDING",
  "job_id": "job-123"
}

⸻

9. AI Review API

AI endpoints are Lead-only.

Review Approved Suggestion

POST /trips/{tripId}/ai/review-suggestion

This is normally triggered internally after Lead approval rather than directly by the frontend.

The AI receives:

* Current itinerary
* Proposed change
* Relevant trip context
* Relevant constraints

Possible result:

{
  "result": "VALID",
  "suggestion_id": "suggestion-123"
}

or:

{
  "result": "CONFLICT",
  "suggestion_id": "suggestion-123",
  "reason": "The proposed activity overlaps with the airport transfer."
}

If valid:

AI
 ↓
Planning Service
 ↓
New itinerary version

If conflicting:

AI
 ↓
Lead
 ↓
Lead decides what to do

AI does not independently modify the itinerary.

⸻

10. AI Planning API

Lead only.

Generate Itinerary

POST /trips/{tripId}/ai/itinerary

Request:

{
  "prompt": "Plan a relaxed 4-day Goa trip."
}

Response:

{
  "job_id": "job-123",
  "status": "QUEUED"
}

The request is asynchronous.

⸻

Modify Itinerary With AI

POST /trips/{tripId}/ai/modify-itinerary
{
  "prompt": "Make Saturday less tiring."
}

Response:

{
  "job_id": "job-456",
  "status": "QUEUED"
}

AI produces a proposal.

The Lead must approve consequential changes.

⸻

11. AI Job Status

GET /jobs/{jobId}

Example:

{
  "job_id": "job-123",
  "status": "COMPLETED",
  "result_id": "ai-result-123"
}

Possible states:

QUEUED
PROCESSING
COMPLETED
FAILED

⸻

12. Recommendation API

Request Recommendations

Lead only.

POST /trips/{tripId}/recommendations
{
  "type": "HOTEL"
}

Possible types:

FLIGHT
TRAIN
HOTEL
ATTRACTION
TICKET

Response:

{
  "job_id": "job-789",
  "status": "QUEUED"
}

⸻

Get Recommendations

GET /trips/{tripId}/recommendations

Lead only for the recommendation-management interface.

Selected/shared recommendation information can be exposed through the member trip view.

⸻

Select Recommendation

POST /trips/{tripId}/recommendations/{recommendationId}/select

Lead only.

The selected result becomes canonical application state where appropriate.

⸻

13. Booking API

WayFinder does not directly book flights/hotels.

It records booking information and external links.

Add Booking

POST /trips/{tripId}/bookings

Lead only.

{
  "type": "HOTEL",
  "provider": "example-provider",
  "booking_reference": "ABC123",
  "external_url": "https://...",
  "start_date": "2026-12-10",
  "end_date": "2026-12-14"
}

⸻

Get Bookings

GET /trips/{tripId}/bookings

Lead and Members according to visibility rules.

⸻

Update Booking

PATCH /trips/{tripId}/bookings/{bookingId}

Lead only.

⸻

14. Transportation Status API

Add Transportation Tracking

Lead only.

POST /trips/{tripId}/transport
{
  "type": "FLIGHT",
  "pnr": "ABC123",
  "carrier": "..."
}

The PNR is stored securely and used by the Travel Status Service.

⸻

Get Transportation Status

GET /trips/{tripId}/transport

Lead and Members can view the resulting status.

⸻

Refresh Transportation Status

POST /trips/{tripId}/transport/{transportId}/refresh

Lead only.

Normally status refreshes should be handled automatically by a background worker.

⸻

15. Timeline API

Get Timeline

GET /trips/{tripId}/timeline

Lead and Members.

Example:

{
  "events": [
    {
      "type": "ITINERARY_UPDATED",
      "description": "Museum moved to Sunday",
      "initiated_by": "member-123",
      "approved_by": "user-456",
      "created_at": "..."
    }
  ]
}

Timeline records are append-oriented and should not be casually edited.

⸻

16. Member Messages

The Lead can send a response when rejecting a suggestion or communicating a decision.

Send Lead Response

POST /trips/{tripId}/members/{memberId}/messages

Lead only.

{
  "message": "We'll keep the current plan."
}

⸻

Get Member Messages

GET /trips/{tripId}/messages

The response is scoped to the caller.

Members only receive messages relevant to them.

⸻

17. Estimated Bill Split

The feature is optional and Lead-controlled.

Generate Estimate

Lead only.

POST /trips/{tripId}/ai/bill-split
{
  "include": [
    "HOTEL",
    "TRANSPORT",
    "ACTIVITIES"
  ]
}

Response:

{
  "job_id": "job-999",
  "status": "QUEUED"
}

⸻

Review Bill Split

GET /trips/{tripId}/bill-split/draft

Lead only.

⸻

Share Bill Split

POST /trips/{tripId}/bill-split/share
{
  "note": "Rough estimate. Meals are not included."
}

Once shared, members can view it.

⸻

Get Shared Bill Split

GET /trips/{tripId}/bill-split

Lead and Members if the Lead has shared it.

⸻

18. Notifications

Notifications are primarily generated by backend events rather than direct synchronous API calls.

Examples:

Suggestion submitted
Suggestion rejected
Suggestion approved
Itinerary changed
Flight delayed
Reminder due
Bill split shared
Lead response received

Internal flow:

Service
  ↓
Domain event
  ↓
BullMQ
  ↓
Notification Worker
  ↓
Email

⸻

19. API Authorization Matrix

Endpoint category	Lead	Member
Authentication	✅	❌
User profile	✅	❌
Create trip	✅	❌
Manage trip	✅	❌
View itinerary	✅	✅
Modify itinerary	✅	❌
Submit suggestion	❌	✅
Review suggestions	✅	❌
Approve suggestion	✅	❌
Reject suggestion	✅	❌
AI planning	✅	❌
Recommendations	✅	View shared
Manage bookings	✅	View
Configure transport tracking	✅	❌
View transport status	✅	✅
View timeline	✅	✅
Member management	✅	❌
Lead responses	Send	Receive
Generate bill estimate	✅	❌
View shared bill estimate	✅	✅
Modify completed trip	❌	❌

⸻

20. Error Format

All APIs should use a consistent error structure.

{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "request_id": "req-123"
  }
}

Common codes:

VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
SERVICE_UNAVAILABLE
INTERNAL_ERROR

⸻

21. Concurrency

Itinerary mutations should use version checking.

Example:

PATCH /trips/{tripId}/itinerary
{
  "version": 7,
  "changes": [...]
}

If the current itinerary is already version 8:

{
  "error": {
    "code": "CONFLICT",
    "message": "The itinerary has changed. Please review the latest version.",
    "request_id": "req-123"
  }
}

This prevents stale changes from overwriting newer state.

⸻

22. API Security Rules

* HTTPS only
* Secure HttpOnly cookies for browser sessions
* CSRF protection where cookie-based authentication requires it
* Passwords hashed using a strong password hashing algorithm
* Rate limiting on authentication endpoints
* Input validation on every endpoint
* Authorization on every trip-scoped endpoint
* Never trust trip_id supplied by the client without checking membership/role
* Invite tokens must be high entropy
* Store invite token hashes rather than raw tokens
* Sensitive booking/transport information must have controlled access
* AI endpoints must enforce TRIP_LEAD authorization

⸻

23. Async API Rule

The following operations should normally return a job rather than wait for completion:

* AI itinerary generation
* AI itinerary modification
* AI suggestion review
* Recommendation retrieval
* AI bill-split generation
* External travel-status synchronization
* Email delivery

Example:

POST /trips/{tripId}/ai/itinerary
        ↓
202 Accepted
{
  "job_id": "job-123",
  "status": "QUEUED"
}

The client can then query:

GET /jobs/job-123

⸻

24. API Design Summary

The API is organized around the following domains:

/auth
/users
/trips
/trips/{tripId}/members
/trips/{tripId}/itinerary
/trips/{tripId}/suggestions
/trips/{tripId}/ai
/trips/{tripId}/recommendations
/trips/{tripId}/bookings
/trips/{tripId}/transport
/trips/{tripId}/timeline
/trips/{tripId}/messages
/trips/{tripId}/bill-split
/trip-invites
/jobs

The API follows the core WayFinder rule:

Members can participate in the trip, but only the Lead can change the official state of the trip. AI can assist the Lead, but it never becomes the authority.

This API contract is the implementation boundary for WayFinder 1.0.
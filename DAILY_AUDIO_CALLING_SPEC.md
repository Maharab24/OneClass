# Daily Audio Calling Specification

## Goal

Add an audio-only Daily call to each OneClass whiteboard room. The Daily secret stays on the Spring Boot server; the browser receives only a short-lived Daily meeting token and a room URL.

## Room and access model

- A OneClass whiteboard room (`roomCode`) maps deterministically to one Daily room named `oneclass-<lowercase-roomCode>`.
- Daily rooms are **private**, expire after 24 hours, start with audio and video disabled, and are limited to 50 participants.
- The backend creates the Daily room on first call access. If it already exists, Daily's conflict response is treated as success.
- Every authenticated caller gets a short-lived (two-hour) Daily meeting token tied to their verified OneClass display name. Tokens can send and receive audio but never video or Daily administration actions.
- The API key is server-side only in `DailyVideoService.DAILY_API_KEY`. It is deliberately a placeholder with a TODO for the project owner to replace. It must never be put in frontend code or a Vite environment variable.

## Backend design

### Package

`com.oneclass.app.features.whiteboard.call`

| Layer | Responsibility |
| --- | --- |
| `dto/DailyCallJoinResponse` | Returns `roomUrl`, `token`, `expiresAt`, and the caller's display name. |
| `service/DailyVideoService` | Calls Daily REST endpoints with Java `HttpClient`; creates/reuses rooms and creates meeting tokens. |
| `controller/AudioCallController` | Authenticated `POST /api/rooms/{roomCode}/audio-call/join` endpoint. Resolves the caller from JWT-backed authentication and verifies that the local whiteboard room exists. |

### Daily REST calls

1. `POST https://api.daily.co/v1/rooms` with a private, audio-only room definition.
2. `POST https://api.daily.co/v1/meeting-tokens` with `properties.room_name`, `user_name`, expiration, and audio-only `permissions`.

Both calls use `Authorization: Bearer <Daily API key>`. Daily API failures are surfaced as a safe `502 Bad Gateway` response; configuration missing from the placeholder produces a clear `503 Service Unavailable` response.

### Backend API

`POST /api/rooms/{roomCode}/audio-call/join`

- Authentication: required (existing JWT security configuration already protects `/api/rooms/**`).
- Success `200`:

```json
{
  "roomUrl": "https://your-domain.daily.co/oneclass-abcdef",
  "token": "short-lived-daily-token",
  "expiresAt": "2026-09-16T12:00:00Z",
  "userName": "Ada Lovelace"
}
```

- `404`: the OneClass room code does not exist.
- `503`: Daily has not been configured (placeholder key remains).
- `502`: Daily rejected or could not process the upstream request.

## Frontend design

- Add `@daily-co/daily-js` as the calling SDK.
- Add `features/whiteboard/call/services/dailyCallService.js`, a small lifecycle wrapper around a Daily call object. It joins audio-only, exposes mute state and participant count, and always leaves/destroys the call during cleanup.
- Add `features/whiteboard/call/components/AudioCallControl.jsx`: a compact floating control in the whiteboard. It provides Join call, mute/unmute, an in-call count, Leave, loading/error states, and an accessible status label.
- `WhiteboardPage` supplies the current OneClass room code and authenticated user to this control. Its unmount cleanup leaves the Daily call so microphone capture is released on navigation.
- The existing whiteboard STOMP presence and participants remain unchanged; Daily participant count is intentionally displayed as call attendance, not merged with whiteboard presence.

## Audio behavior

- Calls are audio-only: Daily is joined with video off and backend token permissions allow only audio send/receive.
- Local audio starts muted to avoid unexpected microphone transmission. The user explicitly presses Unmute after joining.
- Leaving or navigating away stops audio and destroys the Daily client instance.

## Verification

1. Backend unit tests mock Daily HTTP behavior and cover local room absence, unconfigured key, generated request shape, and role-based token permissions.
2. `./mvnw test` passes in `backend`.
3. `npm run build` passes in `frontend`.
4. With a real Daily key inserted, two authenticated users in the same OneClass room can join, unmute, hear one another, mute, leave, and rejoin; no key appears in browser network payloads or built assets.

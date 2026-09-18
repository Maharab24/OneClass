package com.oneclass.app.features.whiteboard.call.service;

import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.whiteboard.call.dto.LiveKitCallJoinResponse;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

/** Issues credentials for a LiveKit room. LiveKit creates the room on first join. */
@Service
public class LiveKitService {

    private static final Duration TOKEN_LIFETIME = Duration.ofHours(2);

    private final String serverUrl;
    private final String apiKey;
    private final String apiSecret;

    public LiveKitService(
            @Value("${app.livekit.url:}") String serverUrl,
            @Value("${app.livekit.api-key:}") String apiKey,
            @Value("${app.livekit.api-secret:}") String apiSecret
    ) {
        this.serverUrl = serverUrl;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    public LiveKitCallJoinResponse createJoinDetails(String roomCode, User user) {
        ensureConfigured();

        String roomName = "oneclass-" + roomCode.trim().toLowerCase();
        // LiveKit identities must be unique in a room. Do not place the user's email in it.
        String identity = "user-" + user.getId();
        Instant expiresAt = Instant.now().plus(TOKEN_LIFETIME);

        String token = Jwts.builder()
                .issuer(apiKey)
                .subject(identity)
                .issuedAt(new Date())
                .expiration(Date.from(expiresAt))
                .claim("name", user.getFullName())
                .claim("video", Map.of(
                        "room", roomName,
                        "roomJoin", true,
                        "canPublish", true,
                        "canSubscribe", true
                ))
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();

        return new LiveKitCallJoinResponse(serverUrl, token, expiresAt, user.getFullName());
    }

    private SecretKey signingKey() {
        try {
            return Keys.hmacShaKeyFor(apiSecret.getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "LiveKit is not configured correctly. LIVEKIT_API_SECRET must be at least 32 characters.");
        }
    }

    private void ensureConfigured() {
        if (serverUrl.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Audio calling is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET on the server.");
        }
        if (!serverUrl.startsWith("ws://") && !serverUrl.startsWith("wss://")) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "LiveKit is not configured correctly. LIVEKIT_URL must begin with ws:// or wss://.");
        }
    }
}

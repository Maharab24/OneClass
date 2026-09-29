package com.oneclass.app.features.whiteboard.call.dto;

import java.time.Instant;

public record LiveKitVideoCallJoinResponse(
        String serverUrl,
        String token,
        Instant expiresAt,
        String userName,
        boolean isHost
) {
}


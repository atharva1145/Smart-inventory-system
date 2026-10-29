package com.smartinventory.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseNotificationService {

    private static final Logger log = LoggerFactory.getLogger(SseNotificationService.class);
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe(String username) {
        SseEmitter emitter = new SseEmitter(600_000L); // 10 minutes timeout
        emitters.add(emitter);

        emitter.onCompletion(() -> {
            log.debug("SSE emitter completed for user: {}", username);
            emitters.remove(emitter);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE emitter timed out for user: {}", username);
            emitters.remove(emitter);
        });

        emitter.onError(e -> {
            log.debug("SSE emitter error for user: {}", username);
            emitters.remove(emitter);
        });

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("message", "Real-time notification stream established", "user", username)));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcast(String eventType, Object data) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventType)
                        .data(data));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }
}

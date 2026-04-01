package com.chatapp.websocket;

import com.chatapp.dto.MessageRequest;
import com.chatapp.dto.MessageResponse;
import com.chatapp.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    /**
     * Handles WebSocket messages sent to /app/chat
     * Persists the message and broadcasts it to /topic/messages
     */
    @MessageMapping("/chat")
    public void sendMessage(@Payload MessageRequest request) {
        log.info("WebSocket message: {} -> {}", request.getSender(), request.getReceiver());

        // Persist message to database
        MessageResponse saved = chatService.sendMessage(request);

        // Broadcast to all subscribers of /topic/messages
        messagingTemplate.convertAndSend("/topic/messages", saved);
    }
}

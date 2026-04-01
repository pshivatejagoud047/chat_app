package com.chatapp.controller;

import com.chatapp.dto.MessageRequest;
import com.chatapp.dto.MessageResponse;
import com.chatapp.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * POST /chat/send
     * Persist a chat message to the database.
     */
    @PostMapping("/send")
    public ResponseEntity<MessageResponse> sendMessage(@Valid @RequestBody MessageRequest request) {
        log.info("Message from {} to {}", request.getSender(), request.getReceiver());
        MessageResponse response = chatService.sendMessage(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /chat/messages?sender=alice@test.com&receiver=bob@test.com
     * Fetch conversation history between two users.
     */
    @GetMapping("/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @RequestParam String sender,
            @RequestParam String receiver) {
        log.info("Fetching messages between {} and {}", sender, receiver);
        List<MessageResponse> messages = chatService.getMessages(sender, receiver);
        return ResponseEntity.ok(messages);
    }
}

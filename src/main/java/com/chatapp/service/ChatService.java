package com.chatapp.service;

import com.chatapp.dto.MessageRequest;
import com.chatapp.dto.MessageResponse;
import com.chatapp.model.ChatMessage;
import com.chatapp.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;

    public MessageResponse sendMessage(MessageRequest request) {
        ChatMessage message = ChatMessage.builder()
                .sender(request.getSender())
                .receiver(request.getReceiver())
                .content(request.getContent())
                .timestamp(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        log.debug("Message saved: {} -> {}", request.getSender(), request.getReceiver());

        return toResponse(saved);
    }

    public List<MessageResponse> getMessages(String sender, String receiver) {
        List<ChatMessage> messages = chatMessageRepository.findConversation(sender, receiver);
        return messages.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private MessageResponse toResponse(ChatMessage msg) {
        return MessageResponse.builder()
                .id(msg.getId())
                .sender(msg.getSender())
                .receiver(msg.getReceiver())
                .content(msg.getContent())
                .timestamp(msg.getTimestamp())
                .build();
    }
}

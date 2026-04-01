package com.chatapp.service;

import com.chatapp.model.User;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void setOnlineStatus(String email, boolean status) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOnline(status);
            userRepository.save(user);
            log.debug("User {} online status set to {}", email, status);
        });
    }
}

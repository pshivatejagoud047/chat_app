package com.chatapp.controller;

import com.chatapp.model.User;
import com.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * GET /users
     * Get all registered users (contact list).
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        // Never expose password hashes to client
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    /**
     * PUT /users/status?email=alice@test.com&online=false
     * Update online/offline status of a user.
     */
    @PutMapping("/status")
    public ResponseEntity<String> updateStatus(
            @RequestParam String email,
            @RequestParam boolean online) {
        userService.setOnlineStatus(email, online);
        return ResponseEntity.ok("Status updated");
    }
}

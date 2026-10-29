package com.smartinventory.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartinventory.security.Role;
import com.smartinventory.user.User;
import com.smartinventory.user.UserRepository;
import com.smartinventory.user.dto.LoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Integration Test: Authentication, JWT & RBAC Access Control")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        if (!userRepository.existsByUsername("testadmin")) {
            userRepository.save(new User(
                    "testadmin", "admin@test.local", passwordEncoder.encode("Password@123"), "Admin Tester", Role.ADMIN
            ));
        }
        if (!userRepository.existsByUsername("testviewer")) {
            userRepository.save(new User(
                    "testviewer", "viewer@test.local", passwordEncoder.encode("Password@123"), "Viewer Tester", Role.VIEWER
            ));
        }
    }

    @Test
    @DisplayName("POST /api/v1/auth/login with valid credentials returns 200 and JWT token")
    void testValidLogin() throws Exception {
        LoginRequest request = new LoginRequest("testadmin", "Password@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.role").value("ADMIN"))
                .andExpect(jsonPath("$.data.username").value("testadmin"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login with wrong password returns 401 Unauthorized")
    void testInvalidLogin() throws Exception {
        LoginRequest request = new LoginRequest("testadmin", "WrongPassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET /api/v1/users without token returns 401 Unauthorized")
    void testProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/users with VIEWER role returns 403 Forbidden")
    void testAdminEndpointWithNonAdminRole() throws Exception {
        // 1. Login as VIEWER
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("testviewer", "Password@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(response).path("data").path("token").asText();

        // 2. Attempt to access admin endpoint
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET /api/v1/users with ADMIN role returns 200 OK")
    void testAdminEndpointWithAdminRole() throws Exception {
        // 1. Login as ADMIN
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("testadmin", "Password@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(response).path("data").path("token").asText();

        // 2. Access admin endpoint
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}

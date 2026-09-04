package com.oneclass.backend.repository;

import com.oneclass.backend.entity.Role;
import com.oneclass.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmailOrPhone(String email, String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<User> findByEmailAndRole(String email, Role role);

    Optional<User> findByPhoneAndRole(String phone, Role role);
}

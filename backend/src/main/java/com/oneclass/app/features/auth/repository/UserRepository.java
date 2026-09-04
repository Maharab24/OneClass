package com.oneclass.app.features.auth.repository;

import com.oneclass.app.features.auth.model.Role;
import com.oneclass.app.features.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmailOrPhone(String email, String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<User> findByEmailAndRole(String email, Role role);

    Optional<User> findByPhoneAndRole(String phone, Role role);
}

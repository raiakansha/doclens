package com.project.doclens_backend.repository;

import com.project.doclens_backend.entity.Conversation;
import com.project.doclens_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByUserOrderByUpdatedAtDesc(User user);
    Optional<Conversation> findByIdAndUser(String id, User user);
    void deleteByIdAndUser(String id, User user);
}

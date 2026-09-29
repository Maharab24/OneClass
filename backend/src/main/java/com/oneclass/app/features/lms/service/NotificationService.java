package com.oneclass.app.features.lms.service;

import com.oneclass.app.features.lms.model.AppNotification;
import com.oneclass.app.features.lms.model.NotificationType;
import com.oneclass.app.features.lms.repository.AppNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final AppNotificationRepository notificationRepository;

    @Transactional
    public void notifyUser(Long userId, NotificationType type, String title, String body, String link, Long classroomId) {
        notificationRepository.save(AppNotification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .classroomId(classroomId)
                .readFlag(false)
                .build());
    }

    @Transactional
    public void notifyUsers(Collection<Long> userIds, NotificationType type, String title, String body, String link, Long classroomId) {
        for (Long userId : userIds) {
            notifyUser(userId, type, title, body, link, classroomId);
        }
    }
}

package com.khangmoihocit.VocabFlow.modules.user.services;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.UserUpdateRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface UserService {
    List<UserResponse> getAll();

    PageResponse<UserResponse> getUsers(int pageNo, int pageSize, String sort, String keyword);

    String uploadAvatar(MultipartFile file);

    UserResponse getMyInfo();

    UserResponse updateBasicInfo(UserUpdateRequest request);

    void deleteAccount();

    void toggleActiveAccount(String id);

}

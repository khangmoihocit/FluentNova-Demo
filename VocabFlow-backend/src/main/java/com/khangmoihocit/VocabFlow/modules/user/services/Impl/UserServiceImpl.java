package com.khangmoihocit.VocabFlow.modules.user.services.Impl;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.mapper.PageMapper;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.services.CloudinaryService;
import com.khangmoihocit.VocabFlow.core.specification.BaseSpecification;
import com.khangmoihocit.VocabFlow.core.specification.GenericSpecificationBuilder;
import com.khangmoihocit.VocabFlow.core.utils.SortUtil;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.UserUpdateRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.UserResponse;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.mappers.UserMapper;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.user.services.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserServiceImpl implements UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PageMapper pageMapper;
    CloudinaryService cloudinaryService;

    @Override
    public List<UserResponse> getAll() {
        List<User> users = userRepository.findAll();
        if (users.isEmpty()) throw new AppException(ErrorCode.USER_IS_EMPTY);
        return users.stream().map(userMapper::toUserResponse).toList();
    }

    @Override
    public PageResponse<UserResponse> getUsers(int pageNo, int pageSize, String sort, String keyword) {
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize, SortUtil.createSort(sort));

//        String role = parameters.containsKey("role") ? parameters.get("role")[0] : null;
//        Boolean isActive = parameters.containsKey("isActive") ? Boolean.valueOf(parameters.get("isActive")[0]) : null;

        GenericSpecificationBuilder<User> builder = new GenericSpecificationBuilder<>();
        if (StringUtils.hasText(keyword)) builder.with("email", ":", keyword);
        Specification<User> specification = builder.build();

        Page<User> userPage = userRepository.findAll(specification, pageable);
        List<UserResponse> userResponses = new ArrayList<>();
        if (!userPage.getContent().isEmpty()) {
            userResponses = userMapper.toListUserResponse(userPage.getContent());
        }

        return pageMapper.toPageResponse(userPage, userResponses);
    }

    @Override
    @Transactional
    public String uploadAvatar(MultipartFile file) {
        try {
            UserDetailsCustom userDetailsCustom = (UserDetailsCustom) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

            String avatarUrl = cloudinaryService.uploadAvatar(file);
            int updated = userRepository.updateAvatar(avatarUrl, userDetailsCustom.getId());
            if(updated == 0) throw new OurException("Cập nhật ảnh cá nhân thất bại!");

            return avatarUrl;
        } catch (Exception e) {
            throw new OurException("Lỗi khi upload avatar");
        }
    }

    @Override
    public UserResponse getMyInfo() {
        UserDetailsCustom userDetailsCustom =
                (UserDetailsCustom) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        User user = userRepository.findById(userDetailsCustom.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toUserResponse(user);
    }

    @Override
    public UserResponse updateBasicInfo(UserUpdateRequest request) {
        User user = userRepository.findById(UserDetailUtil.get().getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setFullName(request.getFullName());
        user.setAnkiDeckName(request.getAnkiDeckName());
        user.setAnkiVideoDeckName(request.getAnkiVideoDeckName());
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public void deleteAccount() {
        int deleted = userRepository.deleteSoft(UserDetailUtil.get().getId());
        if(deleted == 0){
            throw new OurException("Có lỗi trong quá trình xóa tài khoản.");
        }
    }

    @Override
    @Transactional
    public void toggleActiveAccount(String id) {
        int updated = userRepository.toggleIsActive(UUID.fromString(id));
        if (updated == 0){
            throw new OurException("cập nhật is active thất bại.");
        }
    }
}

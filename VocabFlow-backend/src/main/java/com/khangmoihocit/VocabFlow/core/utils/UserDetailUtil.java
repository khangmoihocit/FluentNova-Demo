package com.khangmoihocit.VocabFlow.core.utils;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

public class UserDetailUtil {
    public static UserDetailsCustom get(){
        UserDetailsCustom userDetailsCustom =
                (UserDetailsCustom) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if(userDetailsCustom == null) throw new AppException(ErrorCode.USER_DETAIL_IS_NULL);
        return userDetailsCustom;
    }

    //cho các api 2 th: có token, không token
    public static Optional<UUID> getCurrentUserIdOptional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return Optional.empty(); // Là Guest
        }

        // Là User đã đăng nhập
        UserDetailsCustom userDetails = (UserDetailsCustom) authentication.getPrincipal();
        return Optional.of(userDetails.getId());
    }

    /*

    kiểm tra xem có User không (Optional Auth)
    Optional<UUID> currentUserId = getCurrentUserIdOptional();

    if (currentUserId.isPresent()) {

    }

    */
}

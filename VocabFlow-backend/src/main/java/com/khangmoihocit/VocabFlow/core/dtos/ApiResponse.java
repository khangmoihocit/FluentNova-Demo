package com.khangmoihocit.VocabFlow.core.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import lombok.*;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
public class ApiResponse<T> {
    private Boolean success;
    private String code;
    private String message;
    private T data;
    private Object errors;
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> success(T data){
        ApiResponse<T> res = new ApiResponse<>();
        res.success = true;
        res.code = "SUCCESS";
        res.message = "Success";
        res.data = data;
        return res;
    }

    public static <T> ApiResponse<T> success(T data, String message){
        ApiResponse<T> res = new ApiResponse<>();
        res.success = true;
        res.code = "SUCCESS";
        res.message = message;
        res.data = data;
        return res;
    }

    public static <T> ApiResponse<T> success(String message){
        ApiResponse<T> res = new ApiResponse<>();
        res.success = true;
        res.code = "SUCCESS";
        res.message = message;
        return res;
    }

    public static ApiResponse<?> error(ErrorCode errorCode){
        ApiResponse<?> res = new ApiResponse<>();
        res.success = false;
        res.code = errorCode.getCode();
        res.message = errorCode.getMessage();
        return res;
    }

    public static ApiResponse<?> error(String message){
        ApiResponse<?> res = new ApiResponse<>();
        res.success = false;
        res.code = "ERROR";
        res.message = message;
        return res;
    }

    public static ApiResponse<?> error(ErrorCode errorCode, Object errors){
        ApiResponse<?> res = error(errorCode);
        res.errors = errors;
        return res;
    }
}
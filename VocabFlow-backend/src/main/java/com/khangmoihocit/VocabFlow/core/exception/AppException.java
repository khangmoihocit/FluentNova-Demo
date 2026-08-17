package com.khangmoihocit.VocabFlow.core.exception;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import lombok.Getter;

@Getter
public class AppException extends RuntimeException{
    private ErrorCode errorCode;

    public AppException(ErrorCode errorCode){
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

}

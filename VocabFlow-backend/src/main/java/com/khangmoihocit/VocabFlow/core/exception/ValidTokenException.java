package com.khangmoihocit.VocabFlow.core.exception;

import lombok.Getter;

@Getter
public class ValidTokenException extends RuntimeException{
    public ValidTokenException(String message){
        super(message);
    }
}

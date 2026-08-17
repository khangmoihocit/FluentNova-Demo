package com.khangmoihocit.VocabFlow.core.dtos;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Builder
@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PageResponse <T>{
    int pageNo;
    int pageSize;
    long totalElements;
    int totalPages;
    List<T> data;
}

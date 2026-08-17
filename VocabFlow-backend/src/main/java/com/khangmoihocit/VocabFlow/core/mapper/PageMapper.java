package com.khangmoihocit.VocabFlow.core.mapper;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import org.mapstruct.Mapper;
import org.springframework.data.domain.Page;
import java.util.List;

@Mapper(componentModel = "spring")
public interface PageMapper {

    /**
     * Map từ Spring Page sang PageResponse<T>
     * @param page     - Page từ Spring Data JPA
     * @param content  - List đã được mapper sang DTO (data)
     * @return PageResponse
     */
    default <T> PageResponse<T> toPageResponse(Page<?> page, List<T> content) {
        return PageResponse.<T>builder()
                .pageNo(page.getNumber() + 1)
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .data(content)
                .build();
    }

}
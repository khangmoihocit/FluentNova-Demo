package com.khangmoihocit.VocabFlow.modules.category.mappers;

import com.khangmoihocit.VocabFlow.modules.category.dtos.request.CategoryRequest;
import com.khangmoihocit.VocabFlow.modules.category.dtos.response.CategoryResponse;
import com.khangmoihocit.VocabFlow.modules.category.entities.Category;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    Category toEntity(CategoryRequest request);
    CategoryResponse toResponse(Category entity);
    List<CategoryResponse> toListResponse(List<Category> entities);
    void updateEntityFromRequest(CategoryRequest request, @MappingTarget Category entity);
}

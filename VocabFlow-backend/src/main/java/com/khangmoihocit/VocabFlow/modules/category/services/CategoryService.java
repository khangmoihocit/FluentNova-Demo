package com.khangmoihocit.VocabFlow.modules.category.services;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.category.dtos.request.CategoryRequest;
import com.khangmoihocit.VocabFlow.modules.category.dtos.response.CategoryResponse;
import com.khangmoihocit.VocabFlow.modules.category.dtos.response.HomeCategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
    CategoryResponse getCategoryById(Long id);
    PageResponse<CategoryResponse> getAllCategories(int pageNo, int pageSize);

    List<HomeCategoryResponse> getAllCategoryHome();
}

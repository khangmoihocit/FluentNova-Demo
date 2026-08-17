package com.khangmoihocit.VocabFlow.modules.category.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.category.dtos.request.CategoryRequest;
import com.khangmoihocit.VocabFlow.modules.category.dtos.response.CategoryResponse;
import com.khangmoihocit.VocabFlow.modules.category.dtos.response.HomeCategoryResponse;
import com.khangmoihocit.VocabFlow.modules.category.services.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${spring.api.prefix}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> create(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.createCategory(request), "Tạo danh mục thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.updateCategory(id, request), "Cập nhật danh mục thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa danh mục thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getCategoryById(id)));
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
                                    @RequestParam(name = "pageSize", defaultValue = "20") int pageSize) {
        PageResponse<CategoryResponse> categories = categoryService.getAllCategories(pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.success(categories, "Lấy danh sách thành công"));
    }

    @GetMapping("/get-category-video")
    ResponseEntity<?> getForHome(){
        List<HomeCategoryResponse> categoryResponses = categoryService.getAllCategoryHome();
        return ResponseEntity
                .ok(ApiResponse.success(categoryResponses, "Tải danh sách category - video thành công!"));
    }
}

package com.khangmoihocit.VocabFlow.core.specification;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class BaseSpecification <T>{

    public static <T> Specification<T> keywordSpec(String keyword, String... fields) {
        return (root, query, criteriaBuilder) -> {
            if (keyword == null || keyword.trim().isEmpty() || fields == null || fields.length == 0) {
                return criteriaBuilder.conjunction();
            }

            Predicate[] predicates = new Predicate[fields.length];
            String likeKeyword = "%" + keyword.toLowerCase() + "%";

            for (int i = 0; i < fields.length; i++) {
                predicates[i] = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get(fields[i]).as(String.class)),
                        likeKeyword
                );
            }
            return criteriaBuilder.or(predicates);
        };
    }
}

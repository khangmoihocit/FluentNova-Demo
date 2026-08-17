package com.khangmoihocit.VocabFlow.core.specification;

import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class GenericSpecificationBuilder<T> {

    private final List<Specification<T>> specs = new ArrayList<>();

    public GenericSpecificationBuilder<T> with(String key, String operation, Object value) {
        specs.add(new GenericSpecification<>(new SearchCriteria(key, operation, value)));
        return this;
    }

    public GenericSpecificationBuilder<T> withJoin(String joinAttribute, String targetField, String operation, Object value) {
        specs.add(new JoinSpecification<>(joinAttribute, targetField, operation, value, JoinType.INNER));
        return this;
    }

    public GenericSpecificationBuilder<T> withJoinById(String joinAttribute, Object idValue) {
        specs.add(new JoinSpecification<>(joinAttribute, "id", "=", idValue, JoinType.INNER));
        return this;
    }

    /**
     * Lọc theo ManyToMany join — kiểm tra ID của entity được join có nằm trong danh sách không.
     * Ví dụ: lọc VideoLesson theo nhiều Category IDs.
     */
    public GenericSpecificationBuilder<T> withManyToManyJoinIn(String joinAttribute, String targetField, Collection<?> values) {
        specs.add((root, query, cb) -> {
            query.distinct(true); // Tránh trùng lặp kết quả do ManyToMany join
            var join = root.join(joinAttribute, JoinType.INNER);
            return join.get(targetField).in(values);
        });
        return this;
    }

    public Specification<T> build() {
        if (specs.isEmpty()) {
            return (root, query, cb) -> cb.conjunction();   // WHERE 1=1
        }

        Specification<T> result = specs.get(0);
        for (int i = 1; i < specs.size(); i++) {
            result = Specification.where(result).and(specs.get(i));
        }
        return result;
    }
}
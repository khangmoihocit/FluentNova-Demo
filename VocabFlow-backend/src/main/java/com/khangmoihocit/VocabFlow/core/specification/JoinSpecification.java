package com.khangmoihocit.VocabFlow.core.specification;

import jakarta.persistence.criteria.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;

@Getter
@AllArgsConstructor
public class JoinSpecification<T> implements Specification<T> {

    private final String joinAttribute;     // "user" hoặc "dictionaryWord"
    private final String targetField;       // "id" hoặc "word" (có thể null nếu join bằng entity)
    private final String operation;
    private final Object value;
    private final JoinType joinType;

    @Override
    public Predicate toPredicate(Root<T> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        Join<?, ?> join = root.join(joinAttribute, joinType != null ? joinType : JoinType.INNER);

        // Trường hợp join bằng ID (rất phổ biến với @ManyToOne)
        if ("id".equalsIgnoreCase(targetField) || targetField == null) {
            return cb.equal(join.get("id"), value);
        }

        // Các trường hợp khác (word, name, code...)
        if (":".equalsIgnoreCase(operation)) {
            return cb.like(
                    cb.lower(join.get(targetField).as(String.class)),
                    "%" + value.toString().toLowerCase() + "%"
            );
        } else if ("=".equalsIgnoreCase(operation)) {
            return cb.equal(join.get(targetField), value);
        } else if (">".equalsIgnoreCase(operation)) {
            return cb.greaterThanOrEqualTo(join.get(targetField).as(String.class), value.toString());
        } else if ("<".equalsIgnoreCase(operation)) {
            return cb.lessThanOrEqualTo(join.get(targetField).as(String.class), value.toString());
        }

        return cb.conjunction();
    }
}
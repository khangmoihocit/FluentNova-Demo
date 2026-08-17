package com.khangmoihocit.VocabFlow.core.utils;

import org.springframework.data.domain.Sort;

public class SortUtil {

    //sortParam = "field,sortDirection"
    public static Sort createSort(String sortParam){
        if(sortParam == null || sortParam.isEmpty()){
            return Sort.by(Sort.Order.by("id"));
        }

        String[] parts = sortParam.split(",");
        String field = parts[0];
        String sortDirection = (parts.length > 1) ? parts[1] : "asc";

        if("desc".equalsIgnoreCase(sortDirection)){
            return Sort.by(Sort.Order.desc(field));
        }else{
            return Sort.by(Sort.Order.asc(field));
        }
    }
}

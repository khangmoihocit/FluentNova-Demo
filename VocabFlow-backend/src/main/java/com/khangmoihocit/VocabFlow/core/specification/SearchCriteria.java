package com.khangmoihocit.VocabFlow.core.specification;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SearchCriteria {
    private String key; //tên cột: email, name
    private String operation; //Phép toán (VD: ": " là LIKE, "=" là EQUAL, ">" là LỚN HƠN)
    private Object value; //giá trị cần tìm
}

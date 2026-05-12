package com.Orchestra.OrchestraBackend.dto.response;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Data
@Builder
public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static <E, T> PagedResponse<T> from(Page<E> pageResult, Function<E, T> mapper) {
        return PagedResponse.<T>builder()
            .content(pageResult.getContent().stream().map(mapper).collect(Collectors.toList()))
            .page(pageResult.getNumber())
            .size(pageResult.getSize())
            .totalElements(pageResult.getTotalElements())
            .totalPages(pageResult.getTotalPages())
            .last(pageResult.isLast())
            .build();
    }
}

package com.sgu.poi.exception;

public class PoiNotFoundException extends RuntimeException {

    public PoiNotFoundException(Long id) {
        super("POI not found with id: " + id);
    }
}
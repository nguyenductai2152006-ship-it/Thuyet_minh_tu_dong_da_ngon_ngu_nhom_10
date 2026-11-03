package com.sgu.poi.service;
import com.sgu.poi.dto.CreatePoiRequest;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
class SyncValidationTest {
 private CreatePoiRequest valid(){var r=new CreatePoiRequest();r.setName("Hội An");r.setDescription("Mô tả");r.setLatitude(new BigDecimal("15.1234567"));r.setLongitude(new BigDecimal("108.1234567"));r.setRadius(new BigDecimal("30.01"));r.setQrCode("QR3");return r;}
 @Test void validatesQrRadiusPrecisionAndCategory(){try(var f=Validation.buildDefaultValidatorFactory()){
  var v=f.getValidator();var r=valid();assertTrue(v.validate(r).isEmpty());
  for(String code:new String[]{"a/b","a?b","a#b","a:b","a\\b","a b"}){r=valid();r.setQrCode(code);assertFalse(v.validate(r).isEmpty(),code);}
  r=valid();r.setRadius(new BigDecimal("5000.01"));assertFalse(v.validate(r).isEmpty());
  r=valid();r.setLatitude(new BigDecimal("15.12345678"));assertFalse(v.validate(r).isEmpty());
  r=valid();r.setCategory("other");assertFalse(v.validate(r).isEmpty());
  r=valid();r.setDescription("x".repeat(10001));assertFalse(v.validate(r).isEmpty());
 }}
}

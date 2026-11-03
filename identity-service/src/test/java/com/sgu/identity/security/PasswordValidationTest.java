package com.sgu.identity.security;
import com.sgu.identity.dto.AuthDto.RegisterRequest;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class PasswordValidationTest {
 @Test void enforcesCharactersAndUtf8Bytes(){try(var f=Validation.buildDefaultValidatorFactory()){
  var v=f.getValidator();assertTrue(v.validate(new RegisterRequest("admin@example.org","12345678","Admin")).isEmpty());
  assertFalse(v.validate(new RegisterRequest("admin@example.org","1234567","Admin")).isEmpty());
  assertFalse(v.validate(new RegisterRequest("admin@example.org","あ".repeat(25),"Admin")).isEmpty());
 }}
}

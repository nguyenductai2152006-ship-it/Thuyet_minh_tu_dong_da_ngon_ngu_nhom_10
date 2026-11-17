package com.sgu.audio.service;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Documented
@Constraint(validatedBy = AudioUrlValidator.class)
@Target({
        ElementType.FIELD,
        ElementType.PARAMETER
})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidAudioUrl {

    String message() default "Audio URL must be a valid HTTP or HTTPS URL";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

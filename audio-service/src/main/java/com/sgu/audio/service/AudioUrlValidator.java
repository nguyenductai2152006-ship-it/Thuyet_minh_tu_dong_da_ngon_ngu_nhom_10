package com.sgu.audio.service;

import java.net.URI;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class AudioUrlValidator
        implements ConstraintValidator<ValidAudioUrl, String> {

    @Override
    public boolean isValid(
            String value,
            ConstraintValidatorContext context
    ) {
        if (value == null || value.isBlank()) {
            return true;
        }

        try {
            URI uri = URI.create(value.trim());

            if (!uri.isAbsolute()) {
                return uri.getRawQuery() == null
                        && uri.getRawFragment() == null
                        && uri.getRawPath() != null
                        && uri.getRawPath().matches("/audio/[A-Za-z0-9_-]+\\.mp3");
            }

            String scheme = uri.getScheme();

            return uri.isAbsolute()
                    && scheme != null
                    && (scheme.equalsIgnoreCase("http")
                    || scheme.equalsIgnoreCase("https"))
                    && uri.getHost() != null
                    && !uri.getHost().isBlank()
                    && uri.getUserInfo() == null;

        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}

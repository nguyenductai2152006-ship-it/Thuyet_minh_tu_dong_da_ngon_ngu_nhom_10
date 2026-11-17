package com.sgu.audio.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AudioUrlValidatorTest {

    private AudioUrlValidator validator;

    @BeforeEach
    void setUp() {
        validator = new AudioUrlValidator();
    }

    @Test
    void shouldAcceptHttpsUrl() {
        assertTrue(validator.isValid(
                "https://example.com/audio.mp3",
                null
        ));
    }

    @Test
    void shouldAcceptHttpUrl() {
        assertTrue(validator.isValid(
                "http://example.com/audio.mp3",
                null
        ));
    }

    @Test
    void shouldRejectFtpUrl() {
        assertFalse(validator.isValid(
                "ftp://example.com/audio.mp3",
                null
        ));
    }

    @Test
    void shouldRejectRelativeUrl() {
        assertFalse(validator.isValid(
                "example.com/audio.mp3",
                null
        ));
    }

    @Test
    void shouldRejectUrlWithoutHost() {
        assertFalse(validator.isValid(
                "https://",
                null
        ));
    }

    @Test
    void shouldAllowBlankValueForNotBlankValidator() {
        assertTrue(validator.isValid("", null));
    }
}

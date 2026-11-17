package com.sgu.poi.exception;
import com.sgu.poi.controller.PoiController;
import com.sgu.poi.service.PoiService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
class InvalidParameterTest {
 @Test void nonNumericIdReturns400WithoutCallingService() throws Exception {
  var service = mock(PoiService.class);
  var mvc = MockMvcBuilders.standaloneSetup(new PoiController(service)).setControllerAdvice(new GlobalExceptionHandler()).build();
  mvc.perform(get("/api/pois/not-a-number")).andExpect(status().isBadRequest());
  verifyNoInteractions(service);
 }
}

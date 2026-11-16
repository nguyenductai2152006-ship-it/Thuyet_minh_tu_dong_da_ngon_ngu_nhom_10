package com.sgu.localization.service;
import com.sgu.localization.entity.PoiLocalization;
import com.sgu.localization.repository.PoiLocalizationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class VisibilityTest {
 @Test void checksParentBeforeReturningContent(){
  var repository=mock(PoiLocalizationRepository.class);var validator=mock(PoiReferenceValidator.class);var entity=new PoiLocalization();entity.setId(1L);entity.setPoiId(3L);
  when(repository.findById(1L)).thenReturn(Optional.of(entity));doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND)).when(validator).requireReadable(3L);
  var service=new PoiLocalizationService(repository,validator,mock(PoiMutationLock.class));
  assertThrows(ResponseStatusException.class,()->service.findById(1L));assertThrows(ResponseStatusException.class,()->service.findByPoiId(3L));
 }
}

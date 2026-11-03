package com.sgu.poi.service;
import javax.sql.DataSource;
import java.sql.*;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class PoiMutationLockTest {
 @Test void holdsUntilCompletion()throws Exception{
  var ds=mock(DataSource.class);var c=mock(Connection.class);var s=mock(PreparedStatement.class);var rs=mock(ResultSet.class);
  when(ds.getConnection()).thenReturn(c);when(c.prepareStatement(anyString())).thenReturn(s);when(s.executeQuery()).thenReturn(rs);when(rs.next()).thenReturn(true);when(rs.getInt(1)).thenReturn(1);
  TransactionSynchronizationManager.initSynchronization();TransactionSynchronizationManager.setActualTransactionActive(true);
  try{new PoiMutationLock(ds).acquire(3L);verify(c,never()).close();for(var sync:TransactionSynchronizationManager.getSynchronizations())sync.afterCompletion(TransactionSynchronization.STATUS_COMMITTED);verify(c).prepareStatement("SELECT RELEASE_LOCK(?)");verify(c).close();}
  finally{TransactionSynchronizationManager.clearSynchronization();TransactionSynchronizationManager.setActualTransactionActive(false);}
 }
 @Test void requiresTransaction(){assertThrows(IllegalStateException.class,()->new PoiMutationLock(mock(DataSource.class)).acquire(3L));}
}

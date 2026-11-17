package com.sgu.poi.service;
import javax.sql.DataSource;
import java.sql.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
@Component
public class PoiMutationLock {
 private final DataSource ds;
 public PoiMutationLock(DataSource ds){this.ds=ds;}
 public void acquire(Long id){
  if(!TransactionSynchronizationManager.isActualTransactionActive() || !TransactionSynchronizationManager.isSynchronizationActive()) throw new IllegalStateException("Transaction required");
  String key="hoianguide:poi:"+id; Connection connection=null;
  try {
   connection=ds.getConnection();
   try(var s=connection.prepareStatement("SELECT GET_LOCK(?, 5)")){
    s.setString(1,key);try(var rs=s.executeQuery()){if(!rs.next() || rs.getInt(1)!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"POI đang được cập nhật. Hãy thử lại.");}
   }
   final Connection held=connection;
   TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){
    @Override public void afterCompletion(int status){release(held,key);}
   });
  }catch(Exception e){
   if(connection!=null)release(connection,key);
   if(e instanceof ResponseStatusException response)throw response;
   throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Không khóa được POI.",e);
  }
 }
 private void release(Connection c,String key){
  try(var s=c.prepareStatement("SELECT RELEASE_LOCK(?)")){
   s.setString(1,key);try(var rs=s.executeQuery()){if(!rs.next() || rs.getInt(1)!=1)throw new SQLException("Release failed");}
  }catch(Exception e){try{c.abort(Runnable::run);}catch(Exception ignored){}}
  finally{try{c.close();}catch(Exception ignored){}}
 }
}

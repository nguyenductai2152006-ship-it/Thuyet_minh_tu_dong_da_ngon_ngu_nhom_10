package com.sgu.audio.service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AudioPoiMutationLock {

    private final DataSource dataSource;

    public AudioPoiMutationLock(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void acquire(Long poiId) {

        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("Transaction required");
        }

        String key = "hoianguide:poi:" + poiId;
        Connection connection = null;

        try {
            connection = dataSource.getConnection();

            try (var statement = connection.prepareStatement(
                    "SELECT GET_LOCK(?, 5)"
            )) {
                statement.setString(1, key);

                try (var result = statement.executeQuery()) {
                    if (!result.next() || result.getInt(1) != 1) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "POI is being modified. Please try again."
                        );
                    }
                }
            }

            final Connection heldConnection = connection;

            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCompletion(int status) {
                            release(heldConnection, key);
                        }
                    }
            );

        } catch (Exception ex) {

            if (connection != null) {
                release(connection, key);
            }

            if (ex instanceof ResponseStatusException response) {
                throw response;
            }

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cannot acquire POI mutation lock.",
                    ex
            );
        }
    }

    private void release(Connection connection, String key) {

        try (var statement = connection.prepareStatement(
                "SELECT RELEASE_LOCK(?)"
        )) {
            statement.setString(1, key);

            try (var result = statement.executeQuery()) {
                if (!result.next() || result.getInt(1) != 1) {
                    throw new SQLException("Release lock failed");
                }
            }

        } catch (Exception ex) {
            try {
                connection.abort(Runnable::run);
            } catch (Exception ignored) {
            }

        } finally {
            try {
                connection.close();
            } catch (Exception ignored) {
            }
        }
    }
}

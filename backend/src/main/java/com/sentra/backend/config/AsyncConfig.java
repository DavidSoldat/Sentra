package com.sentra.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class AsyncConfig {

    @Value("${sentra.ingestion.async.core-pool-size:2}")
    private int corePoolSize;

    @Value("${sentra.ingestion.async.max-pool-size:4}")
    private int maxPoolSize;

    @Value("${sentra.ingestion.async.queue-capacity:10}")
    private int queueCapacity;

    @Bean(name = "ingestionExecutor")
    public Executor ingestionExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("ingestion-");
        executor.initialize();
        return executor;
    }

    @Bean(name = "fileProcessingExecutor")
    public Executor fileProcessingExecutor() {
        int cores = Runtime.getRuntime().availableProcessors();
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(cores);
        executor.setMaxPoolSize(cores * 2);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("file-proc-");
        executor.initialize();
        return executor;
    }
}

package com.oneclass.app;

import com.oneclass.app.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OneClassApplication {

    public static void main(String[] args) {
        DotenvLoader.load();
        SpringApplication.run(OneClassApplication.class, args);
    }
}

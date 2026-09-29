package com.oneclass.app.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.StandardEnvironment;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class DotenvLoaderTest {

    private File tempEnvFile;

    @BeforeEach
    void setUp() throws IOException {
        DotenvLoader.reset();
        tempEnvFile = File.createTempFile("test-dotenv-", ".env");
    }

    @AfterEach
    void tearDown() {
        if (tempEnvFile != null && tempEnvFile.exists()) {
            tempEnvFile.delete();
        }
        System.clearProperty("env.file");
        DotenvLoader.reset();
    }

    @Test
    void testParseBasicContent() {
        String content = """
                # Comment line
                SERVER_PORT=8080
                DB_URL=jdbc:postgresql://localhost:5432/oneclass_db?sslmode=disable
                
                # Another comment
                export MAIL_HOST=smtp.gmail.com
                EMPTY_VAL=
                """;

        Map<String, Object> result = DotenvLoader.parseContent(content);

        assertEquals("8080", result.get("SERVER_PORT"));
        assertEquals("jdbc:postgresql://localhost:5432/oneclass_db?sslmode=disable", result.get("DB_URL"));
        assertEquals("smtp.gmail.com", result.get("MAIL_HOST"));
        assertEquals("", result.get("EMPTY_VAL"));
    }

    @Test
    void testParseQuotedValuesAndInlineComments() {
        String content = """
                UNQUOTED_WITH_COMMENT=value123 # inline comment
                DOUBLE_QUOTED="hello \\"world\\"\\nsecond line"
                SINGLE_QUOTED='literal $value # not a comment'
                """;

        Map<String, Object> result = DotenvLoader.parseContent(content);

        assertEquals("value123", result.get("UNQUOTED_WITH_COMMENT"));
        assertEquals("hello \"world\"\nsecond line", result.get("DOUBLE_QUOTED"));
        assertEquals("literal $value # not a comment", result.get("SINGLE_QUOTED"));
    }

    @Test
    void testLoadFromFileViaSystemProperty() throws IOException {
        String key = "CUSTOM_TEST_PROP_" + System.currentTimeMillis();
        try (FileWriter writer = new FileWriter(tempEnvFile)) {
            writer.write(key + "=custom_test_value\n");
        }

        System.setProperty("env.file", tempEnvFile.getAbsolutePath());
        Map<String, Object> loaded = DotenvLoader.load();

        assertEquals("custom_test_value", loaded.get(key));
        assertEquals("custom_test_value", System.getProperty(key));
        System.clearProperty(key);
    }

    @Test
    void testEnvironmentPostProcessor() throws IOException {
        String key = "TEST_POST_PROCESSOR_" + System.currentTimeMillis();
        try (FileWriter writer = new FileWriter(tempEnvFile)) {
            writer.write(key + "=post_processor_value\n");
        }

        System.setProperty("env.file", tempEnvFile.getAbsolutePath());
        DotenvLoader.reset();

        DotenvEnvironmentPostProcessor postProcessor = new DotenvEnvironmentPostProcessor();
        ConfigurableEnvironment environment = new StandardEnvironment();

        postProcessor.postProcessEnvironment(environment, new SpringApplication());

        assertTrue(environment.getPropertySources().contains(DotenvEnvironmentPostProcessor.PROPERTY_SOURCE_NAME));
        assertEquals("post_processor_value", environment.getProperty(key));
        System.clearProperty(key);
    }

    public static void main(String[] args) throws Exception {
        DotenvLoaderTest t = new DotenvLoaderTest();
        t.setUp();
        t.testParseBasicContent();
        t.tearDown();

        t.setUp();
        t.testParseQuotedValuesAndInlineComments();
        t.tearDown();

        t.setUp();
        t.testLoadFromFileViaSystemProperty();
        t.tearDown();

        t.setUp();
        t.testEnvironmentPostProcessor();
        t.tearDown();

        System.out.println("ALL DotenvLoaderTest tests PASSED!");
    }
}

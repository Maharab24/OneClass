package com.oneclass.app.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Utility to discover, parse, and load .env files into Java System properties
 * and Spring Boot Environment property sources.
 */
public final class DotenvLoader {

    private static final Logger log = LoggerFactory.getLogger(DotenvLoader.class);
    private static Map<String, Object> cachedProperties = null;

    private DotenvLoader() {
    }

    /**
     * Loads the .env file if found, populates System properties for missing keys,
     * and returns the loaded key-value map.
     */
    public static synchronized Map<String, Object> load() {
        if (cachedProperties != null) {
            return cachedProperties;
        }

        File envFile = findEnvFile();
        if (envFile == null) {
            log.info("No .env file found in default locations. Using system environment / default configurations.");
            cachedProperties = Collections.emptyMap();
            return cachedProperties;
        }

        log.info("Loading environment variables from: {}", envFile.getAbsolutePath());
        Map<String, Object> envMap = parse(envFile);

        // Populate System properties so any early JVM or non-Spring code can access them,
        // without overriding explicitly provided System properties or OS environment variables.
        for (Map.Entry<String, Object> entry : envMap.entrySet()) {
            String key = entry.getKey();
            String value = String.valueOf(entry.getValue());
            if (System.getProperty(key) == null && System.getenv(key) == null) {
                System.setProperty(key, value);
            }
        }

        cachedProperties = Collections.unmodifiableMap(envMap);
        return cachedProperties;
    }

    /**
     * Resets the cached properties (useful for testing).
     */
    public static synchronized void reset() {
        cachedProperties = null;
    }

    /**
     * Searches for a .env file across standard candidate locations.
     */
    public static File findEnvFile() {
        // 1. Explicit path via -Denv.file or ENV_FILE
        String customPath = System.getProperty("env.file");
        if (customPath == null || customPath.isBlank()) {
            customPath = System.getenv("ENV_FILE");
        }
        if (customPath != null && !customPath.isBlank()) {
            File customFile = new File(customPath);
            if (customFile.exists() && customFile.isFile()) {
                return customFile;
            }
        }

        // Candidate paths relative to current working directory
        String[] candidates = {
            ".env",
            "backend/.env",
            "../.env"
        };

        for (String candidate : candidates) {
            File f = new File(candidate);
            if (f.exists() && f.isFile()) {
                return f;
            }
        }

        return null;
    }

    /**
     * Parses the given .env file into key-value pairs.
     */
    public static Map<String, Object> parse(File file) {
        Map<String, Object> map = new LinkedHashMap<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(file, StandardCharsets.UTF_8))) {
            String rawLine;
            while ((rawLine = reader.readLine()) != null) {
                parseLine(rawLine, map);
            }
        } catch (IOException e) {
            log.warn("Failed to read .env file at {}: {}", file.getAbsolutePath(), e.getMessage());
        }
        return map;
    }

    /**
     * Parses raw string content of a .env file.
     */
    public static Map<String, Object> parseContent(String content) {
        Map<String, Object> map = new LinkedHashMap<>();
        if (content == null || content.isBlank()) {
            return map;
        }
        String[] lines = content.split("\\r?\\n");
        for (String line : lines) {
            parseLine(line, map);
        }
        return map;
    }

    private static void parseLine(String rawLine, Map<String, Object> targetMap) {
        String line = rawLine.trim();
        if (line.isEmpty() || line.startsWith("#")) {
            return;
        }

        // Support 'export KEY=value'
        if (line.startsWith("export ") && line.length() > 7) {
            line = line.substring(7).trim();
        }

        int eqIndex = line.indexOf('=');
        if (eqIndex <= 0) {
            return;
        }

        String key = line.substring(0, eqIndex).trim();
        if (key.isEmpty() || key.startsWith("#")) {
            return;
        }

        String val = line.substring(eqIndex + 1).trim();

        if (val.startsWith("\"")) {
            // Double-quoted value: parse escape sequences up to closing unescaped quote
            StringBuilder sb = new StringBuilder();
            boolean escaped = false;
            for (int i = 1; i < val.length(); i++) {
                char c = val.charAt(i);
                if (escaped) {
                    switch (c) {
                        case 'n': sb.append('\n'); break;
                        case 'r': sb.append('\r'); break;
                        case 't': sb.append('\t'); break;
                        case '\\': sb.append('\\'); break;
                        case '\"': sb.append('\"'); break;
                        default: sb.append('\\').append(c); break;
                    }
                    escaped = false;
                } else if (c == '\\') {
                    escaped = true;
                } else if (c == '\"') {
                    break;
                } else {
                    sb.append(c);
                }
            }
            val = sb.toString();
        } else if (val.startsWith("'")) {
            // Single-quoted value: literal string up to closing single quote
            int endQuote = val.indexOf('\'', 1);
            if (endQuote != -1) {
                val = val.substring(1, endQuote);
            } else {
                val = val.substring(1);
            }
        } else {
            // Unquoted: strip trailing comment if present
            int commentIdx = val.indexOf('#');
            if (commentIdx >= 0) {
                val = val.substring(0, commentIdx).trim();
            }
        }

        targetMap.put(key, val);
    }
}


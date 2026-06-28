package com.sentra.backend.ingestion;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChunkingService {

    private final int chunkSizeChars;
    private final int overlapChars;

    public ChunkingService(
            @Value("${sentra.ingestion.chunk.size-tokens:800}") int sizeTokens,
            @Value("${sentra.ingestion.chunk.overlap-tokens:100}") int overlapTokens) {
        this.chunkSizeChars = sizeTokens * 4;
        this.overlapChars = overlapTokens * 4;
    }

    public List<CodeChunk> chunk(String filePath, String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        List<CodeChunk> chunks = new ArrayList<>();

        int[] lineStarts = buildLineStartTable(content);

        int step = chunkSizeChars - overlapChars;
        int start = 0;

        while (start < content.length()) {
            int end = Math.min(start + chunkSizeChars, content.length());

            if (end < content.length()) {
                int newline = content.indexOf('\n', end);
                if (newline != -1) {
                    end = newline + 1;
                }
            }

            String chunkContent = content.substring(start, end);

            int startLine = charOffsetToLine(lineStarts, start);
            int endLine = charOffsetToLine(lineStarts, Math.max(0, end - 1));

            chunks.add(new CodeChunk(filePath, chunkContent, startLine, endLine));

            start += step;
        }

        return chunks;
    }


    private int[] buildLineStartTable(String content) {
        int newlineCount = 0;
        for (int i = 0; i < content.length(); i++) {
            if (content.charAt(i) == '\n') newlineCount++;
        }

        int[] table = new int[newlineCount + 1];
        table[0] = 0;
        int lineIdx = 1;

        for (int i = 0; i < content.length() && lineIdx < table.length; i++) {
            if (content.charAt(i) == '\n') {
                table[lineIdx++] = i + 1;
            }
        }

        return table;
    }

    private int charOffsetToLine(int[] lineStarts, int charOffset) {
        int lo = 0, hi = lineStarts.length - 1;

        while (lo < hi) {
            int mid = (lo + hi + 1) / 2;
            if (lineStarts[mid] <= charOffset) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }

        return lo + 1;
    }

    public record CodeChunk(
            String filePath,
            String content,
            int startLine,
            int endLine
    ) {}
}

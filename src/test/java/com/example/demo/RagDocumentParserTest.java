package com.example.demo;

import com.example.demo.service.rag.DocumentParserService;
import dev.langchain4j.data.segment.TextSegment;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RagDocumentParserTest {

    @Autowired
    private DocumentParserService documentParserService;

    @Test
    @DisplayName("测试 Markdown 文档解析与切片")
    void testMarkdownParsing() {
        String mdContent = """
                # 电商退换货政策
                ## 1. 无理由退换
                自商品签收之日起 7 天内支持无理由退换货。
                ## 2. 质保条例
                所有数码电子产品享受国家三包政策，提供一年全国联保服务。
                """;

        List<TextSegment> segments = documentParserService.parseMarkdown(
                "售后服务手册.md", mdContent.getBytes(StandardCharsets.UTF_8));

        assertFalse(segments.isEmpty());
        assertEquals("售后服务手册.md", segments.getFirst().metadata().getString("source_file"));
        assertEquals("MD", segments.getFirst().metadata().getString("file_type"));
        assertTrue(segments.getFirst().text().contains("退换货政策"));
    }

    @Test
    @DisplayName("测试 PDF 文档解析与精准页码提取")
    void testPdfParsing() throws Exception {
        byte[] pdfBytes;
        try (PDDocument doc = new PDDocument()) {
            PDPage page1 = new PDPage();
            doc.addPage(page1);

            try (PDPageContentStream stream = new PDPageContentStream(doc, page1)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                stream.newLineAtOffset(50, 700);
                stream.showText("Apple iPhone 16 Specs: 25W Fast Wireless Charging.");
                stream.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            pdfBytes = baos.toByteArray();
        }

        List<TextSegment> segments = documentParserService.parsePdf("iphone_specs.pdf", pdfBytes);
        assertFalse(segments.isEmpty());
        assertEquals("1", segments.getFirst().metadata().getString("page_number"));
        assertTrue(segments.getFirst().text().contains("25W Fast Wireless Charging"));
    }

    @Test
    @DisplayName("测试 Word (.docx) 文档解析")
    void testWordParsing() throws Exception {
        byte[] docxBytes;
        try (XWPFDocument doc = new XWPFDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            XWPFParagraph p = doc.createParagraph();
            XWPFRun run = p.createRun();
            run.setText("Sony WH-1000XM5 User Manual: Press the power button for 3 seconds to pair.");
            doc.write(baos);
            docxBytes = baos.toByteArray();
        }

        List<TextSegment> segments = documentParserService.parseWord("sony_manual.docx", docxBytes);
        assertFalse(segments.isEmpty());
        assertEquals("DOCX", segments.getFirst().metadata().getString("file_type"));
        assertTrue(segments.getFirst().text().contains("WH-1000XM5"));
    }

    @Test
    @DisplayName("测试图片解析与本地 OCR 文本切片提取")
    void testImageParsing() throws Exception {
        BufferedImage image = new BufferedImage(300, 100, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, 300, 100);
        g.setColor(Color.BLACK);
        g.drawString("DISCOUNT 50% OFF", 50, 50);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        byte[] imageBytes = baos.toByteArray();

        List<TextSegment> segments = documentParserService.parseImage("coupon.png", imageBytes);
        assertFalse(segments.isEmpty());
        assertEquals("coupon.png", segments.getFirst().metadata().getString("source_file"));
        assertEquals("IMAGE", segments.getFirst().metadata().getString("file_type"));
    }
}

package com.example.demo.model.vo;

import java.io.Serializable;

/**
 * 来源引用精准溯源详情 VO
 */
public class SourceCitationVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 引用序号 (如 1 对应 [引用1])
     */
    private int citationIndex;

    /**
     * 来源文件名
     */
    private String fileName;

    /**
     * 文档类型 (PDF / DOCX / MD / IMAGE)
     */
    private String fileType;

    /**
     * 页码或段落标识
     */
    private String pageNumber;

    /**
     * 切片索引
     */
    private String chunkId;

    /**
     * 相似度匹配分值 (0.00 ~ 1.00)
     */
    private Double similarityScore;

    /**
     * 召回切片原文片段
     */
    private String contentSnippet;

    public SourceCitationVO() {
    }

    public SourceCitationVO(int citationIndex, String fileName, String fileType, String pageNumber, String chunkId, Double similarityScore, String contentSnippet) {
        this.citationIndex = citationIndex;
        this.fileName = fileName;
        this.fileType = fileType;
        this.pageNumber = pageNumber;
        this.chunkId = chunkId;
        this.similarityScore = similarityScore;
        this.contentSnippet = contentSnippet;
    }

    public int getCitationIndex() {
        return citationIndex;
    }

    public void setCitationIndex(int citationIndex) {
        this.citationIndex = citationIndex;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(String pageNumber) {
        this.pageNumber = pageNumber;
    }

    public String getChunkId() {
        return chunkId;
    }

    public void setChunkId(String chunkId) {
        this.chunkId = chunkId;
    }

    public Double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(Double similarityScore) {
        this.similarityScore = similarityScore;
    }

    public String getContentSnippet() {
        return contentSnippet;
    }

    public void setContentSnippet(String contentSnippet) {
        this.contentSnippet = contentSnippet;
    }
}

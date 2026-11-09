package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 知识库上传文档记录实体类
 */
@TableName("knowledge_document")
public class KnowledgeDocument implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 原始文件名
     */
    private String fileName;

    /**
     * 文档类型 (PDF / DOCX / MD / IMAGE)
     */
    private String fileType;

    /**
     * 文件字节大小
     */
    private Long fileSize;

    /**
     * 切片数量
     */
    private Integer chunkCount;

    /**
     * 处理状态 (SUCCESS / FAILED)
     */
    private String status;

    private LocalDateTime createdAt;

    public KnowledgeDocument() {
    }

    public KnowledgeDocument(String fileName, String fileType, Long fileSize, Integer chunkCount, String status) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.chunkCount = chunkCount;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Integer getChunkCount() {
        return chunkCount;
    }

    public void setChunkCount(Integer chunkCount) {
        this.chunkCount = chunkCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

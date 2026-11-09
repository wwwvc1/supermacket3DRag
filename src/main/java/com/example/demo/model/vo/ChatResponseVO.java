package com.example.demo.model.vo;

import java.io.Serializable;
import java.util.List;

/**
 * 智能体问答统一返回 VO (包含回答内容与精准溯源引用列表)
 */
public class ChatResponseVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 智能体最终回答正文 (带有 [引用N] 标记)
     */
    private String answer;

    /**
     * 精准来源引用溯源清单
     */
    private List<SourceCitationVO> sources;

    public ChatResponseVO() {
    }

    public ChatResponseVO(String answer, List<SourceCitationVO> sources) {
        this.answer = answer;
        this.sources = sources;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public List<SourceCitationVO> getSources() {
        return sources;
    }

    public void setSources(List<SourceCitationVO> sources) {
        this.sources = sources;
    }
}

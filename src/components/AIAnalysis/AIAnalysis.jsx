import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import textAnalysisService from '../../services/textAnalysis';
import './AIAnalysis.css';

export default function AIAnalysis({ content, analysis, loading, error, onClose }) {
  // Remove automatic analysis - now controlled by parent component

  if (loading) {
    return <div className="ai-analysis loading">Analyzing content...</div>;
  }

  if (error) {
    return (
      <div className="ai-analysis error">
        <p>{error}</p>
        <button onClick={onClose} className="close-btn">
          <MdClose size={16} />
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="ai-analysis">
      <div className="analysis-header">
        <h3>AI Analysis {analysis.isFallback && <span className="fallback-badge">Basic</span>}</h3>
        <button onClick={onClose} className="close-btn">
          <MdClose size={16} />
        </button>
      </div>
      {analysis.error && (
        <div className="analysis-warning">
          <p>{analysis.error}</p>
        </div>
      )}
      <div className="analysis-content">
        <div className="analysis-section">
          <h4>Summary</h4>
          <p>{analysis.summary || "No summary available"}</p>
        </div>
        <div className="analysis-section">
          <h4>Suggested Tags</h4>
          <div className="tags-container">
            {analysis.tags?.length > 0 
              ? analysis.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))
              : "No suggested tags"}
          </div>
        </div>
        <div className="analysis-section">
          <h4>Key Terms</h4>
          <div className="key-terms-container">
            {analysis.keyTerms?.length > 0
              ? analysis.keyTerms.map((term, index) => (
                  <span key={index} className="key-term">{term}</span>
                ))
              : "No key terms identified"}
          </div>
        </div>
        <div className="analysis-section">
          <h4>Grammar Check</h4>
          <p>{analysis.grammarCheck || "No grammar issues found"}</p>
        </div>
      </div>
    </div>
  );
}

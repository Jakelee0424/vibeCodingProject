import React, { useState } from 'react';
import '../style/ScoreModal.css';

interface ScoreModalProps {
    isOpen: boolean;
    score: number;
    onSave: (name: string) => void;
    onClose: () => void;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ isOpen, score, onSave, onClose }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>축하합니다!</h2>
                    <p className="high-score-text">새로운 최고 기록을 달성했습니다!</p>
                </div>
                <div className="score-display">
                    <span className="label">SCORE</span>
                    <span className="value">{score}</span>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <label htmlFor="user-name">이름을 입력해주세요</label>
                    <input
                        id="user-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름 (예: 홍길동)"
                        autoFocus
                        maxLength={20}
                    />
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">취소</button>
                        <button type="submit" className="save-btn" disabled={!name.trim()}>저장하기</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScoreModal;

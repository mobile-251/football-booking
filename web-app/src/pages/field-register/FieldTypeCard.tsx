import React from 'react'

interface FieldTypeCardProps {
    name: string
    count: number
    selected: boolean
    onToggle: () => void
    onIncrement: () => void
    onDecrement: () => void
}

const FieldTypeCard: React.FC<FieldTypeCardProps> = ({
    name,
    count,
    selected,
    onToggle,
    onIncrement,
    onDecrement,
}) => {
    return (
        <div className={`field-type-card ${selected ? 'selected-card' : ''}`}>
            <div className="field-type-header">
                <span className="field-type-name">{name}</span>
                <div className="field-type-controls">
                    <button onClick={onDecrement}>−</button>
                    <span>{count}</span>
                    <button onClick={onIncrement}>+</button>
                </div>
            </div>
            <button className={`select-btn ${selected ? 'selected' : ''}`} onClick={onToggle}>
                {selected ? 'Đang chọn' : 'Chọn'}
            </button>
        </div>
    )
}

export default FieldTypeCard

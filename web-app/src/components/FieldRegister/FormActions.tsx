import React from 'react'
import EyeIcon from '../../assets/eye.svg'
import ArrowIcon from '../../assets/arrow.svg'

interface FormActionsProps {
    onPreview: () => void
    onNext: () => void
    disableNext?: boolean
}

const FormActions: React.FC<FormActionsProps> = ({ onPreview, onNext, disableNext }) => {
    return (
        <div className="form-actions">
            <button className="btn-preview" onClick={onPreview}>
                <img src={EyeIcon} alt="Preview" />
                Xem trước
            </button>
            <button className="btn-next" onClick={onNext} disabled={disableNext}>
                Tiếp theo
                <img src={ArrowIcon} alt="Next" />
            </button>
        </div>
    )
}

export default FormActions

import React from "react";
import { EyeIcon, ArrowIcon, BackIcon } from "../../assets/icons";

interface FormActionsProps {
  onPreview: () => void;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  disableNext?: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  onPreview,
  onNext,
  onBack,
  currentStep,
  totalSteps,
  disableNext,
}) => {
  return (
    <div className="form-actions">
      <div className="left-actions">
        {currentStep > 1 && (
          <button className="btn-back" onClick={onBack}>
            <img src={BackIcon} alt="Back" />
            Quay lại
          </button>
        )}
      </div>

      <div className="right-actions">
        <button className="btn-preview" onClick={onPreview}>
          <img src={EyeIcon} alt="Preview" />
          Xem trước
        </button>
        <button className="btn-next" onClick={onNext} disabled={disableNext}>
          {currentStep === totalSteps ? "Hoàn thành" : "Tiếp theo"}
          {currentStep !== totalSteps && <img src={ArrowIcon} alt="Next" />}
        </button>
      </div>
    </div>
  );
};

export default FormActions;

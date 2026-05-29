import React from 'react'

interface Step {
    id: number
    title: string
    subtitle: string
}

interface StepProgressProps {
    steps: Step[]
    currentStep: number
    onStepClick: (stepId: number) => void
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep, onStepClick }) => {
    return (
        <div className="steps-container">
            {steps.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isActive = currentStep === step.id;
                const isNext = step.id === currentStep + 1;

                // Clickable if it's already completed (backward) or the immediate next one (forward)
                const isClickable = isCompleted || isNext;

                return (
                    <div
                        key={step.id}
                        className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
                        onClick={() => isClickable && onStepClick(step.id)}
                        style={{ cursor: isClickable ? 'pointer' : 'default' }}
                    >
                        <div className="step-number-wrapper">
                            <div className="step-number">
                                {step.id}
                            </div>
                        </div>

                        {index < steps.length - 1 && <div className="step-line"></div>}

                        <div className="step-content">
                            <div className="step-title">{step.title}</div>
                            <div className="step-subtitle">{step.subtitle}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default StepProgress


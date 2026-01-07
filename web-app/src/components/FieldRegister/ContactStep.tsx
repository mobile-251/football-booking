import React from 'react'
import type { FieldFormData } from './types'
import MailIcon from '../../assets/mail.svg'
import PhoneIcon from '../../assets/phone.svg'

interface ContactStepProps {
    formData: FieldFormData
    onChange: (newData: FieldFormData) => void
}

const ContactStep: React.FC<ContactStepProps> = ({ formData, onChange }) => {
    return (
        <div className="contact-step">
            <h3 className="section-title">Thông tin liên hệ</h3>
            <p className="section-description">
                Cung cấp thông tin liên hệ để khách hàng có thể liên lạc với sân bóng của bạn.
            </p>

            <div className="contact-form">
                <div className="contact-input-group">
                    <label htmlFor="phone">Số điện thoại liên hệ <span className="required-mark">*</span></label>
                    <div className="input-with-icon">
                        <img src={PhoneIcon} alt="Phone" className="input-icon" />
                        <input
                            type="tel"
                            id="phone"
                            placeholder="Nhập số điện thoại (ví dụ: 090xxxxxxx)"
                            value={formData.phoneNumber}
                            onChange={(e) => onChange({ ...formData, phoneNumber: e.target.value })}
                        />
                    </div>
                </div>

                <div className="contact-input-group">
                    <label htmlFor="email">Địa chỉ Email <span className="required-mark">*</span></label>
                    <div className="input-with-icon">
                        <img src={MailIcon} alt="Email" className="input-icon" />
                        <input
                            type="email"
                            id="email"
                            placeholder="Nhập địa chỉ email của bạn"
                            value={formData.email}
                            onChange={(e) => onChange({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                .contact-step {
                    width: 100%;
                    padding: 20px 0;
                }
                .section-title {
                    color: #1F6650;
                    font-size: 1.25rem;
                    margin-bottom: 8px;
                    border-left: 5px solid #1F6650;
                    padding-left: 16px;
                    font-weight: 700;
                }
                .section-description {
                    color: #64748b;
                    font-size: 0.9rem;
                    margin-bottom: 32px;
                    padding-left: 16px;
                }
                .contact-form {
                    max-width: 600px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .contact-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .contact-input-group label {
                    font-weight: 600;
                    color: #334155;
                    font-size: 0.9rem;
                    padding-left: 4px;
                }
                .required-mark {
                    color: #ef4444;
                    margin-left: 4px;
                    font-weight: bold;
                }
                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 16px;
                    width: 20px;
                    height: 20px;
                    opacity: 0.7;
                }
                .input-with-icon input {
                    width: 100%;
                    padding: 14px 16px 14px 48px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    color: #334155;
                    transition: all 0.2s;
                    background: white;
                    outline: none;
                }
                .input-with-icon input:focus {
                    border-color: #1F6650;
                    box-shadow: 0 0 0 4px rgba(31, 102, 80, 0.1);
                }
                .input-with-icon input::placeholder {
                    color: #94a3b8;
                }

                @media (max-width: 768px) {
                    .contact-step {
                        padding: 10px 0;
                    }
                    .input-with-icon input {
                        padding: 12px 16px 12px 44px;
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </div>
    )
}

export default ContactStep

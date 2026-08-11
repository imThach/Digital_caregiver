import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOtpEmail = async (toEmail, otpCode) => {
    const fromAddress = process.env.EMAIL_FROM || `Digital Caregiver <${process.env.EMAIL_USER}>`;

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #176c3a; margin: 0;">Digital Caregiver</h2>
                <p style="color: #62705f; font-size: 14px; margin-top: 4px;">Care that stays close</p>
            </div>
            <div style="padding: 20px; background-color: #f7f9f5; border-radius: 8px; text-align: center;">
                <p style="color: #182317; font-size: 16px; font-weight: 600; margin-bottom: 12px;">Mã xác thực đăng nhập của bạn</p>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #176c3a; margin: 16px 0; font-family: monospace;">
                    ${otpCode}
                </div>
                <p style="color: #62705f; font-size: 13px; margin: 0;">Mã OTP có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            </div>
            <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #8a9687;">
                <p style="margin: 0;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: fromAddress,
        to: toEmail,
        subject: `[Digital Caregiver] Mã OTP đăng nhập: ${otpCode}`,
        html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
};

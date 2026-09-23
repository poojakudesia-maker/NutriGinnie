<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, Helvetica, Arial, sans-serif; background: #fdf8f2; padding: 32px 16px; margin: 0;">
    <div style="max-width: 420px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #ece1d3;">
        <h1 style="color: #2b2620; font-size: 20px; margin: 0 0 12px;">Hi {{ $name }},</h1>
        <p style="color: #6b6255; font-size: 14px; line-height: 1.5; margin: 0 0 24px;">
            Use this code to activate your NutriPing account. It expires in 15 minutes.
        </p>
        <div style="background: #fde3d3; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #d9581f;">{{ $code }}</span>
        </div>
        <p style="color: #6b6255; font-size: 12px; margin: 0;">
            If you didn't request this, you can safely ignore this email.
        </p>
    </div>
</body>
</html>

import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, pairingApi } from '../../api/apiServices.js'
import { useAuth } from '../../auth/authProvider.jsx'
import loginBg from '../../assets/login_bg.png'
import logo from '../../assets/logo.png'

const CODE_LENGTH = 6

function GoogleIcon() {
  return (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.4] transition-transform group-hover:translate-x-1"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.4] transition-transform group-hover:-translate-x-1"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6 6-6-6 6-6" />
    </svg>
  )
}

function AuthPage() {
  const navigate = useNavigate()
  const { login, checkAuth } = useAuth()
  const [view, setView] = useState('caregiver')

  // States for Elderly Pairing Code
  const [pairingCode, setPairingCode] = useState(Array(CODE_LENGTH).fill(''))
  const elderlyRefs = useRef([])

  // States for Caregiver Email / OTP Login
  const [authStep, setAuthStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState(Array(CODE_LENGTH).fill(''))
  const otpRefs = useRef([])

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [isExistingUser, setIsExistingUser] = useState(false)

  const showElderly = view === 'elderly'
  const hiddenPanel = 'pointer-events-none invisible translate-y-3 scale-[0.98] opacity-0'
  const visiblePanel = 'visible translate-y-0 scale-100 opacity-100'

  const googleLoginUrl = authApi.getGoogleLoginUrl()

  // Countdown timer for OTP Resend
  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  // --- Elderly Pairing Code Handlers ---
  function updatePairingCode(value, index) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextCode = [...pairingCode]
    nextCode[index] = digit
    setPairingCode(nextCode)

    if (digit && index < CODE_LENGTH - 1) {
      elderlyRefs.current[index + 1]?.focus()
    }
  }

  function handlePairingKeyDown(event, index) {
    if (event.key === 'Backspace' && !pairingCode[index] && index > 0) {
      elderlyRefs.current[index - 1]?.focus()
    }
  }

  function handlePairingPaste(event) {
    event.preventDefault()
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, CODE_LENGTH)

    if (!pasted) return

    const nextCode = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((digit, index) => {
      nextCode[index] = digit
    })

    setPairingCode(nextCode)
    elderlyRefs.current[Math.min(pasted.length, CODE_LENGTH) - 1]?.focus()
  }

  async function handleElderlyConnect() {
    setErrorMessage('')
    setSuccessMessage('')
    const fullCode = pairingCode.join('')

    if (fullCode.length !== CODE_LENGTH) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã kết nối.')
      return
    }

    setIsLoading(true)
    try {
      const response = await pairingApi.connectDevice(fullCode)
      if (response.data?.elderly || response.data?.token) {
        const elderlyUser = response.data.elderly || { role: 'elderly' }
        const caregiverName = response.data.caregiver?.fullName || 'Người thân'
        login(elderlyUser)
        setSuccessMessage(`⚡ Kết nối tức thì thành công với người thân (${caregiverName})! Đang chuyển đến màn hình chăm sóc...`)
        setTimeout(() => navigate('/elderly-home'), 1200)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Mã kết nối không chính xác hoặc đã hết hạn (hạn 24h).')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Caregiver Email & OTP Handlers ---
  async function handleSendOtp(e) {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email || !email.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.')
      return
    }

    setIsLoading(true)
    try {
      const res = await authApi.sendOtp(email.trim())
      setIsExistingUser(res.data?.userExists || false)
      setAuthStep('otp')
      setCountdown(60)
      // setOtpCode(Array(CODE_LENGTH).fill('')) // Không cần reset ở đây, để người dùng thấy mã đã nhập nếu quay lại
      setSuccessMessage('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!')
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function updateOtpCode(value, index) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextCode = [...otpCode]
    nextCode[index] = digit
    setOtpCode(nextCode)

    if (digit && index < CODE_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(event, index) {
    if (event.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(event) {
    event.preventDefault()
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, CODE_LENGTH)

    if (!pasted) return

    const nextCode = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((digit, index) => {
      nextCode[index] = digit
    })

    setOtpCode(nextCode)
    otpRefs.current[Math.min(pasted.length, CODE_LENGTH) - 1]?.focus()
  }

  async function handleVerifyOtp(e) {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const fullOtp = otpCode.join('')
    if (fullOtp.length !== CODE_LENGTH) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP.')
      return
    }

    setIsLoading(true)
    try {
      const res = await authApi.verifyOtp(email.trim(), fullOtp)

      if (res.data?.user) {
        login(res.data.user)
        const freshUser = await checkAuth()
        const nextUser = freshUser || res.data.user

        if (nextUser.role === 'elderly') {
          navigate('/elderly-home')
        } else if (res.data.isNewUser || nextUser.profileStatus?.isComplete === false) {
          navigate('/profile')
        } else {
          navigate('/dashboard')
        }
      } else {
        throw new Error('Đăng nhập thất bại. Không nhận được thông tin tài khoản.')
      }
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="grid min-h-svh overflow-hidden bg-[#f7f9f5] text-[#182317] md:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.85fr)]">
      <section
        className="relative isolate flex min-h-[190px] flex-col justify-between overflow-hidden bg-[#134b33] px-6 py-7 md:min-h-svh md:px-12 md:py-11 lg:px-20"
        aria-label="Digital Caregiver"
      >
        <img
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          src={loginBg}
          alt=""
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,38,26,0.88),rgba(8,38,26,0.58)_48%,rgba(8,38,26,0.28))]" />

        <div className="flex items-center gap-3.5 text-white">
          <img src={logo} alt="Digital Caregiver Logo" className="h-11 w-11" />
          <div>
            <p className="m-0 text-[17px] font-bold">Digital Caregiver</p>
            <span className="hidden text-[13px] font-semibold text-white/75 sm:inline">
              Care that stays close
            </span>
          </div>
        </div>

        <div className="max-w-[820px] md:pb-20">
          <h1 className="m-0 max-w-[760px] text-[28px] leading-tight font-extrabold text-balance text-white sm:text-[34px] lg:text-[clamp(44px,5.4vw,76px)]">
            Caring for those who once cared for us is one of the highest honors.
          </h1>
          <div className="mt-5 hidden items-center gap-4 sm:flex md:mt-8">
            <span className="h-[3px] w-14 bg-[#80f5a1]" />
            <p className="m-0 text-xs font-extrabold tracking-[0.16em] text-white/85 uppercase">
              A legacy of care
            </p>
          </div>
        </div>
      </section>

      <section
        className={`relative grid min-h-[auto] place-items-center px-5 pt-9 pb-18 transition-colors md:min-h-svh md:p-12 lg:p-[72px] ${showElderly ? 'bg-[#fbfcf8]' : 'bg-white'
          }`}
        aria-label="Authentication"
      >
        <div
          className={`col-start-1 row-start-1 w-full max-w-[440px] transition-all duration-300 ${showElderly ? hiddenPanel : visiblePanel
            }`}
        >
          <div className="mb-8 md:mb-10">
            <p className="mb-3 text-xs font-extrabold tracking-[0.12em] text-[#176c3a] uppercase">
              Caregiver access
            </p>
            <h2 className="mb-3 text-[34px] leading-none font-extrabold text-[#182317] sm:text-[42px]">
              Welcome back
            </h2>
            <p className="m-0 max-w-[34ch] text-base leading-relaxed text-[#62705f] sm:text-lg">
              Your loved one's health journey continues here.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
              {successMessage}
            </div>
          )}

          <div className="grid gap-5">
            <a
              className="flex h-14 w-full items-center justify-center gap-3.5 rounded-xl border border-[#d7dfd2] bg-white font-extrabold text-[#182317] shadow-[0_10px_28px_rgba(24,35,23,0.06)] transition hover:-translate-y-px hover:border-[#b6c5b0] hover:bg-[#fbfdf9] hover:shadow-[0_24px_50px_rgba(29,54,30,0.15)]"
              href={googleLoginUrl}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </a>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3.5 text-[#62705f]">
              <span className="h-px bg-[#d7dfd2]" />
              <p className="m-0 text-[13px] font-semibold">or continue with email</p>
              <span className="h-px bg-[#d7dfd2]" />
            </div>

            {authStep === 'email' ? (
              <form className="grid gap-3" onSubmit={handleSendOtp}>
                <label className="text-[13px] font-extrabold text-[#62705f]" htmlFor="email">
                  Email address
                </label>
                <input
                  className="h-14 w-full rounded-xl border border-[#d7dfd2] bg-[#fbfcf8] px-4 text-[#182317] outline-none transition focus:border-[#176c3a] focus:ring-4 focus:ring-[#176c3a]/15 disabled:opacity-60"
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  className="mt-1 flex h-14 w-full items-center justify-center rounded-xl bg-[#176c3a] font-bold text-white shadow-[0_18px_32px_rgba(23,108,58,0.22)] transition hover:-translate-y-px hover:bg-[#0d522a] disabled:opacity-60 cursor-pointer"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Login'}
                </button>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={handleVerifyOtp}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-extrabold text-[#62705f]">
                    Enter 6-digit OTP code sent to:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('email')
                      setErrorMessage('')
                      setSuccessMessage('')
                    }}
                    className="text-xs font-bold text-[#176c3a] hover:underline cursor-pointer"
                  >
                    Change email
                  </button>
                </div>
                <p className="text-sm font-semibold text-[#182317] -mt-2">{email}</p>

                <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => updateOtpCode(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="h-14 w-full rounded-xl border border-[#d7dfd2] bg-[#fbfcf8] text-center text-xl font-bold text-[#182317] outline-none transition focus:border-[#176c3a] focus:ring-4 focus:ring-[#176c3a]/15 disabled:opacity-60"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <button
                  className="flex h-14 w-full items-center justify-center rounded-xl bg-[#176c3a] font-extrabold text-white shadow-[0_18px_32px_rgba(23,108,58,0.22)] transition hover:-translate-y-px hover:bg-[#0d522a] disabled:opacity-60 cursor-pointer"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : isExistingUser ? 'Verify & Signin' : 'Verify & Signup'}
                </button>

                <div className="text-center mt-1">
                  {countdown > 0 ? (
                    <p className="text-xs font-semibold text-[#62705f]">
                      Resend OTP code in <span className="font-bold text-[#176c3a]">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-xs font-extrabold text-[#176c3a] hover:underline cursor-pointer"
                      disabled={isLoading}
                    >
                      Resend OTP code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="mt-11 text-center">
            <p className="mb-2 text-[#62705f]">Are you the one receiving care?</p>
            <button
              className="group inline-flex items-center gap-2 border-0 bg-transparent font-extrabold text-[#4f46e5] cursor-pointer"
              type="button"
              onClick={() => setView('elderly')}
            >
              Enter your pairing code
              <ArrowRightIcon />
            </button>
          </div>
        </div>

        <div
          className={`col-start-1 row-start-1 w-full max-w-[440px] transition-all duration-300 ${showElderly ? visiblePanel : hiddenPanel
            }`}
        >
          <button
            className="group mb-8 inline-flex items-center gap-2 border-0 bg-transparent font-extrabold text-[#62705f] hover:text-[#182317] cursor-pointer"
            type="button"
            onClick={() => setView('caregiver')}
          >
            <ArrowLeftIcon />
            Back to caregiver login
          </button>

          <div className="mb-8 md:mb-10">
            <p className="mb-3 text-xs font-extrabold tracking-[0.12em] text-[#176c3a] uppercase">
              Elderly device
            </p>
            <h2 className="mb-3 text-[36px] leading-none font-extrabold text-[#182317] sm:text-[48px]">
              Connect your device
            </h2>
            <p className="m-0 max-w-[34ch] text-lg leading-relaxed font-semibold text-[#62705f] sm:text-xl">
              Please enter the 6-digit code provided by your family.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePairingPaste}>
            {pairingCode.map((digit, index) => (
              <input
                aria-label={`Pairing code digit ${index + 1}`}
                className="aspect-[0.78] min-h-14 w-full rounded-lg border border-[#d7dfd2] bg-[#eef4ea] text-center text-2xl font-black text-[#182317] outline-none transition focus:border-[#176c3a] focus:ring-4 focus:ring-[#176c3a]/15 sm:min-h-16 sm:text-3xl"
                inputMode="numeric"
                key={index}
                maxLength={1}
                onChange={(event) => updatePairingCode(event.target.value, index)}
                onKeyDown={(event) => handlePairingKeyDown(event, index)}
                ref={(element) => {
                  elderlyRefs.current[index] = element
                }}
                type="text"
                value={digit}
              />
            ))}
          </div>

          <button
            className="flex h-16 w-full items-center justify-center rounded-lg bg-[#176c3a] text-lg font-extrabold text-white shadow-[0_18px_32px_rgba(23,108,58,0.22)] transition hover:-translate-y-px hover:bg-[#0d522a] cursor-pointer disabled:opacity-60"
            type="button"
            onClick={handleElderlyConnect}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>

          <div className="mt-6 grid grid-cols-[30px_1fr] gap-3 rounded-lg border border-[#d7dfd2] bg-[#eef4ea] p-4 text-[#62705f]">
            <span
              className="grid h-7 w-7 place-items-center rounded-full bg-[#176c3a] text-base font-black text-white"
              aria-hidden="true"
            >
              i
            </span>
            <p className="m-0 text-sm leading-relaxed font-semibold">
              Ask your caregiver to open Invite and share the current pairing code.
            </p>
          </div>
        </div>

        <p className="absolute bottom-5 m-0 text-[11px] font-extrabold tracking-[0.14em] text-[#62705f]/60 uppercase md:bottom-7">
          Secure caregiver and elderly access
        </p>
      </section>
    </main>
  )
}

export default AuthPage

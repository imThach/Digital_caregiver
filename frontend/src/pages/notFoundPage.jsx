import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f9f9ff] px-5 text-center text-[#141b2b]">
      <div>
        <p className="m-0 text-sm font-black tracking-[0.14em] text-[#006e2f] uppercase">
          404
        </p>
        <h1 className="m-0 mt-3 text-4xl font-black">Page not found</h1>
        <p className="mx-auto mt-3 max-w-sm text-[#3d4a3d]">
          The page you are looking for does not exist.
        </p>
        <Link
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-[#006e2f] px-5 text-sm font-black text-white transition hover:bg-[#005321]"
          to="/login"
        >
          Back to Login
        </Link>
      </div>
    </main>
  )
}

export default NotFoundPage

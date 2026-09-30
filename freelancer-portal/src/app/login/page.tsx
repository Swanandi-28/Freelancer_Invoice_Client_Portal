import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold">
            Freelancer<span className="text-blue-500">Portal</span>
          </Link>

          <p className="text-slate-400 mt-3">
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          <h1 className="text-2xl font-bold mb-2">
            Welcome back
          </h1>

          <p className="text-slate-400 mb-8">
            Enter your details to continue.
          </p>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Login Button */}
          <button
            type="button"
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium transition"
          >
            Login
          </button>

          {/* Register */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-blue-400 hover:text-blue-300"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Back */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            ← Back to home
          </Link>
        </div>

      </div>
    </main>
  );
}
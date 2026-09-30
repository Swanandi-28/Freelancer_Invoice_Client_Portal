import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold">
            Freelancer<span className="text-blue-500">Portal</span>
          </Link>

          <p className="text-slate-400 mt-3">
            Create your account to get started
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          <h1 className="text-2xl font-bold mb-2">
            Create an account
          </h1>

          <p className="text-slate-400 mb-8">
            Choose how you will use FreelancerPortal.
          </p>

          {/* Role Selection */}
          <div className="mb-6">

            <label className="block text-sm font-medium mb-3">
              I am a
            </label>

            <div className="grid grid-cols-2 gap-4">

              <button
                type="button"
                className="p-4 rounded-xl border border-blue-500 bg-blue-500/10 text-left"
              >
                <div className="text-2xl mb-2">💼</div>

                <div className="font-semibold">
                  Freelancer
                </div>

                <div className="text-sm text-slate-400 mt-1">
                  Manage clients, projects and invoices.
                </div>
              </button>

              <button
                type="button"
                className="p-4 rounded-xl border border-slate-700 hover:border-blue-500 text-left"
              >
                <div className="text-2xl mb-2">🏢</div>

                <div className="font-semibold">
                  Client
                </div>

                <div className="text-sm text-slate-400 mt-1">
                  Manage freelancers, projects and invoices.
                </div>
              </button>

            </div>

          </div>

          {/* Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

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
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm your password"
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Register */}
          <Link
            href="/register"
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
          >
            Create Account
          </Link>

          {/* Login */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300"
            >
              Login
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
import Link from "next/link";

export default function SignupPage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-brand-navy-900">
            Create your account
          </h1>
          <p className="mt-2 text-brand-navy-600">
            Start planning your next race
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-brand-navy-200 p-8">
          <p className="text-center text-brand-navy-600">
            Sign up form coming soon...
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-brand-navy-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-sky-500 hover:text-brand-sky-600"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

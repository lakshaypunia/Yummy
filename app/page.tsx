import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
          Welcome to Yummy Web
        </h1>

        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
          Your favorite application, now on the web. Experience a seamless and powerful interface engineered for your workflow.
        </p>

        <div className="pt-8">
          {!userId ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignInButton mode="modal">
                <button className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-colors duration-200 w-full sm:w-auto shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-8 py-3 rounded-full bg-neutral-800 text-white font-semibold hover:bg-neutral-700 transition-colors duration-200 w-full sm:w-auto border border-neutral-700">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-emerald-400 font-medium bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
                You are securely logged in.
              </p>
              <Link
                href="/dashboard"
                className="px-8 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold hover:from-orange-400 hover:to-red-500 transition-all duration-200 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

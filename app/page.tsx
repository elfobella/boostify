import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { Sparkles, Zap, Shield, Rocket } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      {/* Background Pattern with Light Rays */}
      <div className="fixed inset-0 -z-10">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Light rays from top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-blue-500/20 via-cyan-500/10 to-transparent rounded-full blur-3xl dark:from-blue-500/10 dark:via-cyan-500/5"></div>
        
        {/* Light from bottom right */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-t from-blue-400/20 to-transparent rounded-full blur-3xl dark:from-blue-400/10"></div>
      </div>
      
      <Navbar />
      
      <main className="flex-1 relative z-0">
        {/* Hero Section */}
        <section className="container px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Boostify
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 opacity-70 sm:text-xl">
              Modern Next.js application with dark mode support, beautiful UI
              components, and smooth animations.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#features"
                className="rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 hover:from-blue-700 hover:to-cyan-700 dark:shadow-blue-400/30 transition-all"
              >
                Get started
              </a>
              <a
                href="#about"
                className="text-sm font-semibold leading-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container px-4 py-24 md:py-32 relative">
          {/* Decorative gradient blob */}
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-[100px] dark:from-blue-500/20 dark:to-cyan-500/20"></div>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Features
            </h2>
            <p className="mt-2 text-lg leading-8 opacity-70">
              Everything you need to build modern web applications
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50 dark:shadow-blue-400/30">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  Modern UI Components
                </dt>
                <dd className="mt-2 text-base leading-7 opacity-70">
                  Built with shadcn/ui and Tailwind CSS for beautiful and
                  accessible components.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50 dark:shadow-blue-400/30">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  Smooth Animations
                </dt>
                <dd className="mt-2 text-base leading-7 opacity-70">
                  Powered by Framer Motion for delightful user interactions.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-foreground">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Shield className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Dark Mode
                </dt>
                <dd className="mt-2 text-base leading-7 opacity-70">
                  Full dark mode support with next-themes for seamless
                  experience.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-foreground">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Rocket className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Type Safe
                </dt>
                <dd className="mt-2 text-base leading-7 opacity-70">
                  Fully typed with TypeScript for better developer experience.
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

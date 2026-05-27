export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-sky-300">Next.js starter</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
          TypeScript + Tailwind is ready.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          This project is set up with the App Router, TypeScript, and Tailwind CSS so you can
          start building right away.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm text-sky-200">
            app/page.tsx
          </span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
            app/globals.css
          </span>
          <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
            tailwind.config.ts
          </span>
        </div>
      </section>
    </main>
  );
}


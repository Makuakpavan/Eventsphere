import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[#6d35e8]">404 · Lost in the crowd?</p>
        <h1 className="mt-3 text-4xl font-black">This page isn't on the lineup.</h1>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-[#6d35e8] px-6 py-3 font-bold text-white">Back to EventSphere</Link>
      </div>
    </main>
  );
}

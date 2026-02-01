// app/not-found.tsx
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-center px-6">
      {/* Logo */}
      <div className="relative h-24 w-24 mb-6">
        <Image
          src="/images/c2.png"
          alt="Cadet Mate"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Text */}
      <h1 className="text-2xl md:text-3xl font-semibold text-white">
        You&apos;ve gone off course, sailor
      </h1>

      <p className="mt-2 text-white/80">
        Head back to the cross track
      </p>

      {/* Button */}
      <Link
        href="/home"
        className="mt-8 inline-flex items-center justify-center
                   px-6 py-3 rounded-lg
                   bg-white text-primary font-semibold
                   hover:bg-white/90 transition"
      >
        Back to Home
      </Link>
    </div>
  );
}

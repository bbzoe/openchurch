import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export function AuthCover({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <Link href="/sign-in" className="inline-flex items-center">
            <Image src="/lockup.svg" alt="OpenChurch" width={180} height={28} className="h-7 w-auto" style={{ width: "auto" }} priority />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-forest lg:block">
        <Image
          src="/auth/fern.jpg"
          alt="A green fern frond"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent" />
        <p className="absolute right-4 bottom-4 left-4 text-xs text-ivory/80">
          Blechnum gibbum. Photo by Forest and Kim Starr, CC BY 3.0 us.
        </p>
      </div>
    </div>
  );
}

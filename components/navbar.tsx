import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold">
        ProspectsEasy
      </Link>
      <div className="flex gap-6">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <Link href="/templates" className="hover:underline">
          Templates
        </Link>
        <Link href="/account" className="hover:underline">
          Account
        </Link>
      </div>
    </nav>
  )
}

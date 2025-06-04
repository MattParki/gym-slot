import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold">
        Gym Slot
      </Link>
      <div className="flex gap-6">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <Link href="/bookings" className="hover:underline">
          Bookings
        </Link>
        <Link href="/account-settings" className="hover:underline">
          Account
        </Link>
      </div>
    </nav>
  )
}
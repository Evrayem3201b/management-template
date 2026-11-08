export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--border)] px-4 py-4 text-[var(--text-900)] bg-[var(--background)]">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">
          &copy; {year} Siyana. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
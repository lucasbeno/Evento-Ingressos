export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-danger/40 bg-danger/10 px-6 py-8 text-center text-danger">
      {message}
    </div>
  )
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6" aria-busy>
      <div className="flex items-center gap-4">
        <div className="skel size-16 rounded-full" />
        <div className="space-y-2">
          <div className="skel h-5 w-40" />
          <div className="skel h-3.5 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel h-20" />
        ))}
      </div>
      <div className="skel h-40" />
      <div className="skel h-56" />
    </div>
  );
}

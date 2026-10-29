export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 p-4 md:p-6" aria-busy>
      <div className="skel h-7 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel h-28" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="skel h-64 lg:col-span-2" />
        <div className="skel h-64" />
      </div>
    </div>
  );
}

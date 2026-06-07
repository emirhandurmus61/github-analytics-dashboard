import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Merhaba, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          GitHub verilerini çekmek için senkronizasyonu başlat.
        </p>
      </div>

      {/* Senkronizasyon kartı */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800">
            <svg
              className="h-7 w-7 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-lg font-medium text-zinc-100">
          Veriler henüz yüklenmedi
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          GitHub repolarını ve commit geçmişini çekmek için senkronizasyonu
          başlat. İlk senkronizasyon birkaç dakika sürebilir.
        </p>
        <button className="rounded-xl bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white">
          Senkronizasyonu Başlat
        </button>
      </div>
    </div>
  );
}

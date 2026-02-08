import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <h1 className="text-2xl font-bold mb-4">つくばホワイト歯科</h1>
      <p className="text-gray-500 mb-6">管理ダッシュボード</p>
      <Link
        href="/admin"
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        管理画面へ
      </Link>
    </main>
  );
}

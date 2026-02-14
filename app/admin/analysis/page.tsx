"use client";

import useSWR from "swr";
import type { Profile } from "@/lib/types";
import { formatJst } from "@/lib/format";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type StampBucketKey = "zero" | "oneTo4" | "fiveTo9" | "tenTo19" | "twentyPlus";

const bucketLabels: Record<StampBucketKey, string> = {
  zero: "0個",
  oneTo4: "1〜4個",
  fiveTo9: "5〜9個",
  tenTo19: "10〜19個",
  twentyPlus: "20個以上",
};

export default function AdminAnalysisPage() {
  const { data: profiles = [], error } = useSWR<Profile[]>("/api/profiles", fetcher);

  if (error) {
    return (
      <p className="text-destructive">
        分析用データの取得に失敗しました。しばらくしてから再試行してください。
      </p>
    );
  }

  const totalProfiles = profiles.length;
  const totalStamp = profiles.reduce((sum, p) => sum + (p.stamp_count ?? 0), 0);
  const friendCount = profiles.filter((p) => p.is_line_friend === true).length;
  const friendRate = totalProfiles ? Math.round((friendCount / totalProfiles) * 100) : 0;
  const totalReservationClicks = profiles.reduce((sum, p) => sum + (p.reservation_button_clicks ?? 0), 0);
  const avgReservationClicks = totalProfiles ? (totalReservationClicks / totalProfiles).toFixed(1) : "0.0";

  const now = Date.now();
  const days14 = 14 * 24 * 60 * 60 * 1000;
  const recentLoginCount = profiles.filter((p) => {
    if (!p.updated_at) return false;
    const t = Date.parse(p.updated_at);
    if (Number.isNaN(t)) return false;
    return now - t <= days14;
  }).length;

  const latestLogin = profiles
    .map((p) => p.updated_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  const buckets: Record<StampBucketKey, number> = {
    zero: 0,
    oneTo4: 0,
    fiveTo9: 0,
    tenTo19: 0,
    twentyPlus: 0,
  };

  for (const p of profiles) {
    const c = p.stamp_count ?? 0;
    if (c === 0) buckets.zero += 1;
    else if (c <= 4) buckets.oneTo4 += 1;
    else if (c <= 9) buckets.fiveTo9 += 1;
    else if (c <= 19) buckets.tenTo19 += 1;
    else buckets.twentyPlus += 1;
  }

  const maxBucket = Math.max(...Object.values(buckets), 1);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">利用状況の分析</h1>
        <p className="text-sm text-muted-foreground">
          Supabase の `profiles` をもとに、スタンプの分布と友だち登録・最新ログイン状況を集計しています。
        </p>
      </header>

      {/* サマリーカード */}
      <section className="grid gap-4 md:grid-cols-5">
        <SummaryCard
          label="登録ユーザー数"
          value={totalProfiles.toLocaleString()}
          sub="profiles テーブルの件数"
        />
        <SummaryCard
          label="スタンプ総数"
          value={totalStamp.toLocaleString()}
          sub="stamp_count の合計"
        />
        <SummaryCard
          label="予約ボタンクリック数"
          value={`${totalReservationClicks.toLocaleString()}回`}
          sub={`平均 ${avgReservationClicks}回/人`}
        />
        <SummaryCard
          label="公式アカ友だち"
          value={`${friendCount.toLocaleString()}人`}
          sub={`全体の ${friendRate}%`}
        />
        <SummaryCard
          label="直近14日でログイン"
          value={`${recentLoginCount.toLocaleString()}人`}
          sub={latestLogin ? `最終ログイン: ${formatJst(latestLogin)}` : "ログイン履歴なし"}
        />
      </section>

      {/* スタンプ分布 */}
      <section className="rounded-xl border bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">スタンプ数の分布</h2>
          <p className="text-xs text-muted-foreground">
            どのくらい通っている患者さんが多いかをざっくり把握できます。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            {Object.entries(buckets).map(([key, count]) => {
              const k = key as StampBucketKey;
              const ratio = count === 0 ? 0 : count / maxBucket;
              return (
                <div key={k}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{bucketLabels[k]}</span>
                    <span className="text-muted-foreground">{count}人</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="space-y-3 text-xs text-muted-foreground">
            <p className="font-medium text-sm text-foreground">メモ</p>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>スタンプ数が多いほど「来院頻度が高い患者さん」です。</li>
              <li>`0個` が多い場合は、初診だけの方が多い可能性があります。</li>
              <li>将来的に「スタンプ◯個以上の方へ一斉メッセージ」などの条件に使えます。</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 友だち数・ログイン状況の簡易グラフ（バー） */}
      <section className="rounded-xl border bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">友だち登録と直近14日のアクティブ</h2>
          <p className="text-xs text-muted-foreground">
            公式アカウントの友だち登録状況と、直近2週間のアクティブユーザー数です。
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <MiniBar
            label="公式アカ友だち"
            total={totalProfiles}
            active={friendCount}
            activeLabel="友だち"
            inactiveLabel="未友だち"
            color="bg-emerald-500"
          />
          <MiniBar
            label="直近14日でログイン"
            total={totalProfiles}
            active={recentLoginCount}
            activeLabel="直近14日内"
            inactiveLabel="14日以上ログインなし"
            color="bg-indigo-500"
          />
        </div>
      </section>
    </div>
  );
}

function SummaryCard(props: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground mb-1">{props.label}</p>
      <p className="text-xl font-semibold tracking-tight mb-1">{props.value}</p>
      {props.sub && <p className="text-[11px] text-muted-foreground">{props.sub}</p>}
    </div>
  );
}

function MiniBar(props: {
  label: string;
  total: number;
  active: number;
  activeLabel: string;
  inactiveLabel: string;
  color: string;
}) {
  const { label, total, active, activeLabel, inactiveLabel, color } = props;
  const activeRatio = total ? active / total : 0;
  const inactive = total - active;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
        <div
          className={`${color} h-full transition-all`}
          style={{ width: `${activeRatio * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>
          {activeLabel}: <span className="font-semibold text-foreground">{active}</span>
        </span>
        <span>
          {inactiveLabel}: <span className="font-semibold text-foreground">{inactive}</span>
        </span>
      </div>
    </div>
  );
}


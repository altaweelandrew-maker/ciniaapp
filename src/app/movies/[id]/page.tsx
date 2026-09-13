import { MovieDetailClient } from "@/components/movies/MovieDetailClient";
import { FALLBACK_MOVIES } from "@/db/fallback-data";

export function generateStaticParams() {
  return FALLBACK_MOVIES.map((m) => ({ id: m.id }));
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MovieDetailClient id={id} />;
}

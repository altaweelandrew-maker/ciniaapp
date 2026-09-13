import { SeatSelectionClient } from "@/components/seats/SeatSelectionClient";
import { getFallbackShowtimes } from "@/db/fallback-data";

export function generateStaticParams() {
  return getFallbackShowtimes().map((st) => ({ id: st.id }));
}

export default async function SeatSelectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SeatSelectionClient showtimeId={id} />;
}

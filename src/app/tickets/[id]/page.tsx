import { TicketClient } from "@/components/tickets/TicketClient";

export function generateStaticParams() {
  return [{ id: "preview" }, { id: "default" }];
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TicketClient id={id} />;
}

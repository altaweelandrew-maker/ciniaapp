import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export function generateStaticParams() {
  return [{ bookingId: "preview" }, { bookingId: "default" }];
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <CheckoutClient bookingId={bookingId} />;
}

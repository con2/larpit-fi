import { notFound } from "next/navigation";

export async function GET(_request: Request) {
  notFound();
}

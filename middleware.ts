import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Gestione solo se è hrascendpress.online
  if (!host.endsWith("hrascendpress.online")) {
    return NextResponse.next();
  }

  // Ignora dominio root e www
  if (
    host === "hrascendpress.online" ||
    host === "www.hrascendpress.online"
  ) {
    return NextResponse.next();
  }

  const subdomain = host.replace(".hrascendpress.online", "");
  url.pathname = `/quiz/${subdomain}`;
  return NextResponse.rewrite(url);
}

export const metadata = { title: "Split Admin" };

/** Root admin layout — no auth here; login must stay outside the protected group */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

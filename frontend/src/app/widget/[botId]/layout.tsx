export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  // Pure headless layout. No sidebars, no background colors.
  // This layout is exclusively for the external client Iframe!
  return (
    <html lang="en">
      <body className="bg-transparent m-0 p-0 overflow-hidden text-sm">
        {children}
      </body>
    </html>
  );
}

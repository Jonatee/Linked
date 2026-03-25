import "./globals.css";
import Providers from "@/providers";
import { LINKED_LOGO_URL } from "@/lib/brand";

export const metadata = {
  title: "LInked",
  description: "A production-structured social social platform foundation.",
  icons: {
    icon: LINKED_LOGO_URL,
    shortcut: LINKED_LOGO_URL,
    apple: LINKED_LOGO_URL
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

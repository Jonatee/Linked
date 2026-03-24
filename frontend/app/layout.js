import "./globals.css";
import Providers from "@/providers";

export const metadata = {
  title: "LInked",
  description: "A production-structured social social platform foundation."
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


import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSCI 4750 Group 5 Spring 2025 Project",
  description: "Group 5 Project MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

// TODO: Uncomment the following code and implement user role session management
// export default async function Layout({
//                                          children,
//                                      }: {
//     children: React.ReactNode;
// }) {
//     const user = await getUser();
//
//     return (
//         <html lang="en">
//         <body>
//         {children}
//         </body>
//         </html>    )
// }

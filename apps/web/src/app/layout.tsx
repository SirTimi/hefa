import type { Metadata } from "next";
import './globals.css';
//import Providers from "./providers";

export const metadata: Metadata = {
    title: "Hefa",
    description: "A multivendor e-commerce platform",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                {/* <Providers>{children}</Providers> */}
                {children}
            </body>
        </html>
    );
}
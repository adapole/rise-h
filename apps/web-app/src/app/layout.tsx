import type { Metadata } from "next"
import "@/styles/globals.css"
import styles from "@/styles/Home.module.css"
import "@/styles/Footer.module.css"
import { ReduxProvider } from "@/context/ReduxProvider"
import HashConnectButton from "@/components/HashConnectButton"
import Link from "next/link"
import Image from "next/image"

import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Rise Demo",
    description: "A Decentralized Interbank Settlement on Hedera."
}

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com"></link>
                <link rel="preconnect" href="https://fonts.gstatic.com"></link>
                <link
                    href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
                    rel="stylesheet"
                ></link>
            </head>
            <body suppressHydrationWarning className={inter.className}>
                <ReduxProvider>
                    {/* ===== Header (common) ===== */}
                    <header className={styles.header}>
                        <div className={styles.logo}>
                            <div className={styles.logoIcon}>R</div>
                            <div className={styles.logoText}>Rise</div>
                        </div>

                        <div className={styles.nav}>
                            <Link href="/voting" className={styles.navLink}>
                                Peg Voting
                            </Link>
                            <Link href="/mint-token" className={styles.navLink}>
                                Mint Tokens
                            </Link>
                            <Link href="/transfer" className={styles.navLink}>
                                Bank Transfers
                            </Link>
                            <HashConnectButton />
                            {/* <div className={styles.userMenu}>
                        <Image src="/menu.svg" alt="Menu" width={16} height={16} />
                        <Image src="/user.svg" alt="User" width={24} height={24} />
                    </div> */}
                        </div>
                    </header>

                    {/* ===== Page Content ===== */}
                    <div className="pageWrapper">{children}</div>

                    {/* ===== Footer (common) ===== */}
                    <footer className="footerModern">
                        <div className="footerInner">
                            <div className="footerBrand">
                                <Image src="/icon.svg" alt="Rise Demo" width={40} height={40} />
                                {/* <img src="/logo.svg" alt="Rise Demo" className="footerLogo" /> */}
                                <span>Rise Demo</span>
                            </div>

                            <nav className="footerNav">
                                <a href="/">Home</a>
                                <a href="/voting">Voting</a>
                                <a href="/mint-token">Mint</a>
                                <a href="/transfer">Transfer</a>
                                <a href="https://hedera.com" target="_blank" rel="noopener noreferrer">
                                    Hedera
                                </a>
                            </nav>

                            <div className="footerSocial">
                                <a href="#" aria-label="GitHub">
                                    <Image src="/icons/github.svg" alt="GitHub" width={20} height={20} />
                                </a>
                                <a href="#" aria-label="Twitter">
                                    <Image src="/icons/github.svg" alt="Twitter" width={20} height={20} />
                                </a>
                                <a href="#" aria-label="LinkedIn">
                                    <Image src="/icons/linkedin.svg" alt="LinkedIn" width={20} height={20} />
                                </a>
                            </div>
                        </div>

                        <div className="footerBottomModern">
                            <span>© {new Date().getFullYear()} Rise Project — Built on Hedera</span>
                        </div>
                    </footer>
                </ReduxProvider>
            </body>
        </html>
    )
}

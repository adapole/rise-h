import PageContainer from "@/components/PageContainer"
import type { Metadata } from "next"
import { LogContextProvider } from "@/context/LogContext"
import { SemaphoreContextProvider } from "@/context/SemaphoreContext"
import "./globals.css"

export const metadata: Metadata = {
    title: "Semaphore Voting Demo",
    description: "A zero-knowledge protocol for anonymous signaling on Ethereum."
}

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <SemaphoreContextProvider>
            <LogContextProvider>
                <PageContainer>{children}</PageContainer>
            </LogContextProvider>
        </SemaphoreContextProvider>
    )
}

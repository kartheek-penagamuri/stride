import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const airbnb = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800']
})

export const metadata: Metadata = {
    title: 'Atomic Habits - Build Better, Stack Higher',
        description: 'Transform your life through tiny changes that compound into remarkable results. Start small, stack smart, achieve big.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={airbnb.className}>{children}</body>
        </html>
    )
}

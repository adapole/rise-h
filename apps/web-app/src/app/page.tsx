"use client"

import Image from "next/image"
import Link from "next/link"
import styles from "@/styles/Home.module.css"
import HashConnectButton from "@/components/HashConnectButton"

// import dynamic from 'next/dynamic';
// const HashConnectButton = dynamic(
//   () => import('@/components/HashConnectButton'),
//   { ssr: false }
// );

export default function Home() {
    return (
        <>
            <section
                className={styles.hero}
                style={{
                    backgroundImage: "url('/images/hero_africa.png')"
                }}
            >
                <div className={styles.heroOverlay}></div>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Decentralized Interbank Settlement</h1>
                    <p className={styles.heroSubtitle}>
                        Instant, secure, and transparent settlements powered by Hedera Hashgraph
                    </p>
                    <button className="btn btn-primary">Get Started</button>
                </div>
            </section>

            <div className="container">
                <div className={styles.featuresGrid}>
                    <div className={styles.featureCard}>
                        <Image src="/icons/secure.svg" alt="Secure" width={40} height={40} />
                        <h3>Secure Settlements</h3>
                        <p>All transactions validated on Hedera&apos;s distributed ledger.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <Image src="/icons/middlemen.svg" alt="No Middlemen" width={40} height={40} />
                        <h3>No Intermediaries</h3>
                        <p>Direct peer-to-peer settlements between banks with smart contracts.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <Image src="/icons/fees.svg" alt="Lower Fees" width={40} height={40} />
                        <h3>Lower Costs</h3>
                        <p>Reduce traditional banking fees and cross-border settlement times.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <Image src="/icons/reviews.svg" alt="Transparency" width={40} height={40} />
                        <h3>Transparent Ledger</h3>
                        <p>All settlement events recorded immutably and auditable by banks.</p>
                    </div>
                </div>
            </div>
        </>
    )
}

const categories = [
    { name: "Beach", image: "/images/category-beach.svg" },
    { name: "Mountain", image: "/images/category-mountain.svg" },
    { name: "City", image: "/images/category-city.svg" },
    { name: "Countryside", image: "/images/category-mountain.svg" },
    { name: "Luxury", image: "/images/category-luxury.svg" },
    { name: "Unique", image: "/images/category-luxury.svg" },
    { name: "Pool", image: "/images/category-beach.svg" },
    { name: "Lake", image: "/images/category-mountain.svg" }
]

const properties = [
    {
        id: "1",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=500&q=80",
        location: "Villa in Malibu, California",
        rating: "4.97",
        reviews: 128,
        title: "Luxury Villa with Ocean View",
        price: "1250",
        usd: "250"
    },
    {
        id: "2",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=500&q=80",
        location: "Apartment in New York, NY",
        rating: "4.85",
        reviews: 96,
        title: "Modern Downtown Apartment",
        price: "900",
        usd: "180"
    },
    {
        id: "3",
        image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=500&q=80",
        location: "Cabin in Aspen, Colorado",
        rating: "4.92",
        reviews: 74,
        title: "Cozy Mountain Cabin",
        price: "1050",
        usd: "210"
    },
    {
        id: "4",
        image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=500&q=80",
        location: "Bungalow in Miami, Florida",
        rating: "4.89",
        reviews: 112,
        title: "Beachfront Bungalow",
        price: "975",
        usd: "195"
    },
    {
        id: "5",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&q=80",
        location: "Loft in Barcelona, Spain",
        rating: "4.78",
        reviews: 86,
        title: "Historic City Center Loft",
        price: "825",
        usd: "165"
    },
    {
        id: "6",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80",
        location: "Farmhouse in Tuscany, Italy",
        rating: "4.95",
        reviews: 104,
        title: "Countryside Farmhouse",
        price: "1150",
        usd: "230"
    },
    {
        id: "7",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=500&q=80",
        location: "Cottage in Lake Tahoe, Nevada",
        rating: "4.82",
        reviews: 68,
        title: "Lakeside Cottage",
        price: "875",
        usd: "175"
    },
    {
        id: "8",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=500&q=80",
        location: "Penthouse in Los Angeles, California",
        rating: "4.99",
        reviews: 142,
        title: "Luxury Penthouse",
        price: "1600",
        usd: "320"
    }
]

const advantages = [
    {
        icon: "/icons/secure.svg",
        title: "Secure Payments",
        text: "All transactions are secured by Hedera's distributed ledger technology"
    },
    {
        icon: "/icons/middlemen.svg",
        title: "No Middlemen",
        text: "Connect directly with property owners through smart contracts"
    },
    {
        icon: "/icons/fees.svg",
        title: "Lower Fees",
        text: "Save up to 15% compared to traditional booking platforms"
    },
    {
        icon: "/icons/reviews.svg",
        title: "Transparent Reviews",
        text: "Verified reviews stored immutably on the blockchain"
    }
]

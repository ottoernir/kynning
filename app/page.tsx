"use client";
import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import dynamic from "next/dynamic";

// Dynamically import the HTTP sensor chart component with no SSR
// This is necessary because it uses browser-specific APIs
const HTTPSensorChart = dynamic(
  () => import("@/components/HTTPSensorChart"),
  { ssr: false }
);

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title()}>IoT Dashboard</h1>
        <h2 className={subtitle()}>Temperature Reading</h2>
      </div>

      <div className="w-full max-w-5xl p-4 bg-background shadow-lg rounded-lg">
        <HTTPSensorChart />
      </div>
    </section>
  );
}
"use client";

import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";
import {
  ArrowRight,
  Award,
  Droplets,
  HeartHandshake,
  HeartPulse,
  Search,
  ShieldCheck,
  Siren,
  Stethoscope,
} from "lucide-react";

const features = [
  {
    icon: Siren,
    title: "Emergency SOS",
    description:
      "Doctors post urgent blood and organ requests that reach matching donors instantly.",
  },
  {
    icon: Search,
    title: "Smart matching",
    description:
      "Donors are matched by blood type, location, and donation availability.",
  },
  {
    icon: Award,
    title: "Recognition",
    description:
      "Earn badges for every donation and build a lifetime of impact.",
  },
  {
    icon: ShieldCheck,
    title: "Verified & secure",
    description:
      "Clerk-powered authentication with role-based access for donors and doctors.",
  },
];

const steps = [
  {
    num: "01",
    title: "Create your profile",
    description:
      "Sign up as a donor or doctor and add your blood type and location.",
  },
  {
    num: "02",
    title: "Match & connect",
    description:
      "Doctors publish requests; available donors with the right blood type see them.",
  },
  {
    num: "03",
    title: "Donate & save lives",
    description: "Respond to requests, log your donation, and earn badges.",
  },
];

export function LandingView() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50 via-white to-white">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-red-200/50 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 shadow-sm">
              <HeartPulse className="size-3.5" />
              Every 2 seconds someone needs blood
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Give life.{" "}
              <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Donate.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600">
              LifeBridge connects blood and organ donors with hospitals in real
              time. Sign up as a donor to give, or as a doctor to request what
              your patients urgently need.
            </p>

            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="group rounded-2xl border border-red-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-300 hover:shadow-lg hover:shadow-red-600/10">
                <span className="flex size-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30">
                  <Droplets className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-zinc-900">
                  I&apos;m a Donor
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Register to donate blood, plasma, organs or tissue and get
                  matched with those in need.
                </p>
                <SignUpButton
                  mode="modal"
                  fallbackRedirectUrl="/redirect?role=DONOR"
                >
                  <span className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition hover:bg-red-700">
                    Create donor account
                    <ArrowRight className="size-4" />
                  </span>
                </SignUpButton>
              </div>

              <div className="group rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg">
                <span className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
                  <Stethoscope className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-zinc-900">
                  I&apos;m a Doctor
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Post urgent requests and search for available donors near your
                  hospital.
                </p>
                <SignUpButton
                  mode="modal"
                  fallbackRedirectUrl="/redirect?role=DOCTOR"
                >
                  <span className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800">
                    Create doctor account
                    <ArrowRight className="size-4" />
                  </span>
                </SignUpButton>
              </div>
            </div>

            <p className="mt-6 text-sm text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-red-600 underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {[
            { value: "2,400+", label: "Registered donors" },
            { value: "860", label: "Lives impacted" },
            { value: "120", label: "Partner hospitals" },
            { value: "99.9%", label: "Response rate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold text-red-600">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Built to save lives, faster
          </h2>
          <p className="mt-3 text-lg text-zinc-600">
            Everything a modern donation platform needs — in one place.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-red-200 hover:shadow-lg hover:shadow-red-600/5"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Icon className="size-5.5" />
                </span>
                <h3 className="mt-4 font-bold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-zinc-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              How it works
            </h2>
            <p className="mt-3 text-lg text-zinc-600">
              Three simple steps from sign-up to saving a life.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="relative rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <span className="text-4xl font-extrabold text-red-100">
                  {step.num}
                </span>
                <h3 className="mt-2 text-lg font-bold text-zinc-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 px-6 py-14 text-center text-white shadow-xl shadow-red-600/25">
          <HeartHandshake className="mx-auto size-12 text-red-200" />
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold sm:text-4xl">
            Your donation could be someone&apos;s second chance
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-red-100">
            Join LifeBridge today and become part of a community that never lets
            a request go unanswered.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <SignUpButton
              mode="modal"
              fallbackRedirectUrl="/redirect?role=DONOR"
            >
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-6 py-3 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-50">
                <Droplets className="size-4" />
                Register as a donor
              </span>
            </SignUpButton>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Stethoscope className="size-4" />
              Doctor? Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

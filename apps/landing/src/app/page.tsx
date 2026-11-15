import Link from "next/link";
import { BadgeCheck, Banknote, Bike, MapPinned, Tag, Wallet } from "lucide-react";
import { buttonVariants, ChowLaneLogo } from "@chowlane/ui";
import { DevToolbar } from "@chowlane/mocks/react";
import { BrandBuilder } from "@/components/brand-builder";

const STEPS = [
  {
    title: "Name your business",
    body: "Sign up, choose your link and your color. Your apps carry your name from day one.",
  },
  {
    title: "Add restaurants and riders",
    body: "List the restaurants you deliver for, set their menus and prices, and invite your riders.",
  },
  {
    title: "Share your link",
    body: "Post it on your Facebook page. Customers open it, install your app and order.",
  },
];

const LOCAL = [
  {
    icon: Banknote,
    title: "Cash on delivery",
    body: "Customers pay the rider. Your admin records the cash at the end of each shift.",
  },
  {
    icon: Bike,
    title: "Riders buy at the store",
    body: "Riders pay the restaurant, then collect from the customer. You see the receipt.",
  },
  {
    icon: BadgeCheck,
    title: "Verified first orders",
    body: "New customers log in with Facebook and send a valid ID and a selfie.",
  },
  {
    icon: MapPinned,
    title: "Your delivery fees",
    body: "Per kilometer, a fixed fee, or a price for each barangay you serve.",
  },
  {
    icon: Wallet,
    title: "Your way of paying riders",
    body: "A daily rate, a share of the delivery fee, or a fixed amount per delivery.",
  },
  {
    icon: Tag,
    title: "Promos and rewards",
    body: "Coupons, free delivery after a number of orders, free gifts and points.",
  },
];

const APPS = [
  {
    title: "Customer app",
    body: "Your name, logo and color. Customers browse, order and track the rider.",
  },
  {
    title: "Rider app",
    body: "Time in, accept orders, see the cash to bring, and close the shift.",
  },
  {
    title: "Console",
    body: "Approve orders and customers, assign riders, manage menus, fees and coupons.",
  },
];

const FAQ = [
  {
    q: "Do I need a developer or my own server?",
    a: "No. ChowLane hosts everything. You set up your business from the console.",
  },
  {
    q: "Do customers download it from an app store?",
    a: "No. Customers open your link and add your app to their home screen. It works on Android and iPhone.",
  },
  {
    q: "How do customers pay?",
    a: "Cash on delivery. Online payments like GCash and Maya are planned for later.",
  },
  {
    q: "How much does it cost?",
    a: "You can start for free. As you grow, ChowLane sets up a plan with you — monthly, per order, or both.",
  },
  {
    q: "Do restaurants need to install anything?",
    a: "No. You or your admins manage their menus and prices.",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="ChowLane home">
            <ChowLaneLogo />
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Log in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pt-12 pb-20 md:pt-24 md:pb-32">
          <BrandBuilder />
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <h2 className="display max-w-xl text-3xl md:text-4xl">
              Up and running in an afternoon
            </h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span
                    aria-hidden="true"
                    className="text-sm font-medium text-muted-foreground tabular-nums"
                  >
                    Step {i + 1}
                  </span>
                  <h3 className="mt-2 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <h2 className="display max-w-xl text-3xl md:text-4xl">
              Built for how delivery works here
            </h2>
            <p className="mt-3 max-w-prose text-muted-foreground">
              Cash, pabili, barangays and verified customers — the way delivery businesses in the
              Philippines already run.
            </p>
            <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {LOCAL.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <Icon className="size-5 text-chowlane" aria-hidden="true" />
                  <dt className="mt-3 font-semibold">{title}</dt>
                  <dd className="mt-1.5 text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t bg-mist">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1fr_1.4fr] md:py-28">
            <div>
              <h2 className="display text-3xl md:text-4xl">Three apps, all yours</h2>
              <p className="mt-3 max-w-prose text-muted-foreground">
                Each one installs from your link onto any phone, with your name on the home screen.
              </p>
            </div>
            <ul className="flex flex-col divide-y border-y">
              {APPS.map((a) => (
                <li key={a.title} className="py-5">
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="mt-1 text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-3xl px-5 py-20 md:py-28">
            <h2 className="display text-3xl md:text-4xl">Questions</h2>
            <div className="mt-10 border-b">
              {FAQ.map((f) => (
                <details key={f.q} className="group border-t py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium outline-none focus-visible:underline">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="text-xl leading-none text-muted-foreground transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-2 max-w-prose text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-20 md:flex-row md:items-center md:justify-between">
            <h2 className="display max-w-lg text-3xl">
              Your riders, your customers, your name on the app.
            </h2>
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Start your delivery business
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <ChowLaneLogo />
          <p>Made for delivery businesses in the Philippines.</p>
        </div>
      </footer>
      <DevToolbar app="landing" />
    </>
  );
}

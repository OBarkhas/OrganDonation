import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      fallbackRedirectUrl="/redirect?role=DONOR"
      appearance={{
        elements: {
          card: "shadow-xl rounded-2xl",
          rootBox: "w-full",
        },
      }}
    />
  );
}

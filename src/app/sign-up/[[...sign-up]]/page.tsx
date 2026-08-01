import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
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

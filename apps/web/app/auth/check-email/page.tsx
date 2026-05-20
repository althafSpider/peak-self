import { MailIcon } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="flex max-w-sm flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <MailIcon className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-balance text-muted-foreground">
            We sent you a magic link to sign in. Click the link in the email to
            access your account.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <a
              href="/auth/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              try again
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

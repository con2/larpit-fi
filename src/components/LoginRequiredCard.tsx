import { MessageCard } from "./MessageCard";
import SignInButton from "./SignInButton";

interface Props {
  messages: {
    title: string;
    message: string;
    actions: {
      login: string;
    };
  };
}

/** A "please sign in" notice in place of one section of a page. Whole pages use `LoginRequiredPage`. */
export function LoginRequiredCard({ messages: t }: Props) {
  return (
    <MessageCard title={t.title} message={t.message}>
      <SignInButton className="btn btn-primary">{t.actions.login}</SignInButton>
    </MessageCard>
  );
}

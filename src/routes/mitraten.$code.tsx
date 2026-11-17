import { createFileRoute, Link } from "@tanstack/react-router";
import { BonusPhone } from "@/components/jeopardy/BonusPhone";

export const Route = createFileRoute("/mitraten/$code")({
  component: SecretEstimatePage,
});
function SecretEstimatePage() {
  const { code } = Route.useParams();
  return (
    <>
      <BonusPhone code={code.toUpperCase()} />
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2">
        <Link to="/" className="text-[11px] text-muted-foreground hover:text-foreground">Nowotnick Quiz</Link>
      </div>
    </>
  );
}

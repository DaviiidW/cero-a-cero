import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinGroupForm } from "@/components/groups/join-group-form";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-session";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { findGroupByInviteCode, isGroupMember } from "@/lib/groups/service";
import { isInviteActive } from "@/lib/invite-code";
import { MAX_GROUP_MEMBERS } from "@/lib/constants/groups";

type UnirseLinkPageProps = {
  params: Promise<{ code: string }>;
};

export default async function UnirseLinkPage({ params }: UnirseLinkPageProps) {
  const { code } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/unirse/${code}`)}`);
  }

  const group = await findGroupByInviteCode(code);

  if (!group) {
    return (
      <ErrorCard
        title="Enlace no válido"
        message={GROUP_ERRORS.INVITE_INVALID}
      />
    );
  }

  if (!isInviteActive(group.inviteExpiresAt)) {
    return (
      <ErrorCard
        title="Enlace caducado"
        message={GROUP_ERRORS.INVITE_EXPIRED}
      />
    );
  }

  if (group._count.members >= MAX_GROUP_MEMBERS) {
    return (
      <ErrorCard title="Grupo completo" message={GROUP_ERRORS.MEMBER_LIMIT} />
    );
  }

  const alreadyMember = await isGroupMember(session.user.id, group.id);
  if (alreadyMember) {
    redirect(`/grupos/${group.id}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Unirse al grupo</h1>
        <p className="text-muted-foreground">
          Has sido invitado a unirte a este grupo
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <JoinGroupForm
          defaultCode={group.inviteCode}
          defaultNick={session.user.nickGlobal}
          groupName={group.name}
        />
      </div>
    </div>
  );
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        <Button asChild>
          <Link href="/grupos">Ir a mis grupos</Link>
        </Button>
      </div>
    </div>
  );
}

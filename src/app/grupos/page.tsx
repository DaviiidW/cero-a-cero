import { requireAuthenticatedUser } from "@/lib/groups/access";
import { getUserGroups } from "@/lib/groups/service";
import { GroupMenuClient } from "@/components/dashboard/group-menu-client";

export default async function GruposPage() {
  const user = await requireAuthenticatedUser();
  const groups = await getUserGroups(user.id);

  const simplified = groups.map((g) => ({
    id: g.id,
    name: g.name,
    image: g.image,
  }));

  return <GroupMenuClient groups={simplified} />;
}

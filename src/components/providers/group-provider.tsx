"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Group = {
  id: string;
  name: string;
  image: string | null;
  inviteCode: string;
  membersCount?: number;
};

type GroupContextType = {
  selectedGroupId: string | null;
  selectedGroup: Group | null;
  groups: Group[];
  isLoadingGroups: boolean;
  changeGroup: (groupId: string) => void;
  refreshGroups: () => Promise<void>;
};

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(true);

  const fetchGroups = async () => {
    if (status !== "authenticated") {
      setGroups([]);
      setSelectedGroupId(null);
      setIsLoadingGroups(false);
      return;
    }

    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        const userGroups = data.groups || [];
        setGroups(userGroups);

        // Try to load from localStorage
        const stored = localStorage.getItem("selectedGroupId");
        if (stored && userGroups.some((g: Group) => g.id === stored)) {
          setSelectedGroupId(stored);
        } else if (userGroups.length > 0) {
          setSelectedGroupId(userGroups[0].id);
          localStorage.setItem("selectedGroupId", userGroups[0].id);
        } else {
          setSelectedGroupId(null);
        }
      }
    } catch (err) {
      console.error("Error fetching user groups:", err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const changeGroup = (groupId: string) => {
    if (groups.some((g) => g.id === groupId)) {
      setSelectedGroupId(groupId);
      localStorage.setItem("selectedGroupId", groupId);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  return (
    <GroupContext.Provider
      value={{
        selectedGroupId,
        selectedGroup,
        groups,
        isLoadingGroups,
        changeGroup,
        refreshGroups: fetchGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
}

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadNotifications() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", u.user.id)
        .eq("read", false);
      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      channel = supabase
        .channel(`notif-unread-${u.user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${u.user.id}` },
          () => qc.invalidateQueries({ queryKey: ["notifications", "unread"] }),
        )
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

  return query.data ?? 0;
}

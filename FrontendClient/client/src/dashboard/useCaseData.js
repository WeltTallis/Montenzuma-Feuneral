import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../utils/context/socketContext";

import {
  fetchAllBranchDeceased,
  DECEASED_CHANGED_EVENT,
} from "../api/dashboardDataApi";
import { fetchReleasesFeed, fetchPostmortemsFeed } from "../api/dashboardFeedApi";
import { buildCases } from "./opsData";

/**
 * Pulls the three feeds (deceased register, body releases, postmortem
 * requests) and merges them into the dashboard's case list.
 *
 * Handles:
 * - overlapping loads (a slower earlier response never overwrites a newer one)
 * - forced first load on mount (never a stale cached snapshot)
 * - tab-visibility refresh when data is aging
 * - live socket updates, coalesced into a single load per burst
 *
 * @returns {{ cases: any[], loading: boolean, reload: (force?: boolean) => Promise<void> }}
 */
export function useCaseData() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  // Timestamp of the last successful load — used to decide whether a tab that
  // just regained focus really needs another network round trip.
  const lastLoadRef = useRef(0);
  // Guards against overlapping loads: several feeds + several branches can be
  // in flight at once, and a slower earlier response must never overwrite a
  // newer one.
  const inflightRef = useRef(0);
  const { socket } = useSocket();

  const load = useCallback(async (force = false) => {
    const ticket = ++inflightRef.current;
    setLoading(true);
    try {
      const [deceased, releases, postmortems] = await Promise.all([
        fetchAllBranchDeceased(force).catch(() => []),
        fetchReleasesFeed().catch(() => []),
        fetchPostmortemsFeed().catch(() => []),
      ]);
      // A newer load started while this one was in flight — drop this result.
      if (ticket !== inflightRef.current) return;
      setCases(
        buildCases(
          Array.isArray(deceased) ? deceased : [],
          Array.isArray(releases) ? releases : [],
          Array.isArray(postmortems) ? postmortems : []
        )
      );
      lastLoadRef.current = Date.now();
    } catch (e) {
      console.warn("[Operations dashboard] feed load failed:", e?.message);
      if (ticket === inflightRef.current) setCases([]);
    } finally {
      if (ticket === inflightRef.current) setLoading(false);
    }
  }, []);

  // ALWAYS force the first load: opening the dashboard must show the register
  // exactly as it is now, never a cached snapshot from a page view ago (that
  // cache is what hid a just-registered deceased body).
  useEffect(() => {
    load(true);
  }, [load]);

  // A record registered/released anywhere in the app fires this event, so the
  // dashboard repaints with fresh data even while it stays mounted.
  useEffect(() => {
    const refresh = () => {
      load(true);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Coming back to the tab: refresh only when the numbers are aging.
      if (Date.now() - lastLoadRef.current > 60 * 1000) load(true);
    };
    window.addEventListener(DECEASED_CHANGED_EVENT, refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(DECEASED_CHANGED_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Live updates. The in-app event above only fires in the tab that performed
  // the write, so a body registered by a colleague (or in another tab) used to
  // leave the dashboard stale until it was reloaded. The backend already emits
  // these on every register / release / postmortem write, so subscribe to them
  // and refresh. Bursts are coalesced into one load so a bulk import does not
  // fire a request per row.
  useEffect(() => {
    if (!socket) return undefined;
    let timer = null;
    const schedule = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        load(true);
      }, 400);
    };
    const EVENTS = [
      "notification:deceased-admitted",
      "deceased-admitted",
      "notification:deceased-removed",
      "deceased-removed",
      "notification:deceased-updated",
      "deceased-updated",
      "notification:body-released",
      "body-released",
      "notification:postmortem-request",
      "postmortem-request",
      "notification:postmortem-update",
      "postmortem-update",
    ];
    EVENTS.forEach((e) => socket.on(e, schedule));
    return () => {
      if (timer) clearTimeout(timer);
      EVENTS.forEach((e) => socket.off(e, schedule));
    };
  }, [socket, load]);

  return { cases, loading, reload: load };
}
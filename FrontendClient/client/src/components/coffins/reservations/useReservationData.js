/**
 * useReservationData — month-scoped fetching for the reservations tab.
 * Preserves the parent booking/coffin prop seeding and URL-driven month state.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import api from '../../../api/axios';
import { getParentTenantSlug, getTenantId } from '../../../utils/globalAuth';

function toArr(r) {
  if (!r) return [];
  const d = r.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.bookings)) return d.bookings;
  return [];
}

function toInt(v) {
  const s = String(v == null ? '' : v).trim();
  if (!/^\d{1,6}$/.test(s)) return NaN;
  const n = parseInt(s, 10);
  return isFinite(n) ? n : NaN;
}

export function useReservationData(bookings, coffins) {
  const [_sp, searchParams] = useSearchParams();
  const [_sps, setSearchParams] = _sp;

  const searchPar = searchParams;
  const setSearchPar = setSearchParams;

  const rawMonth = toInt(searchPar.get('month'));
  const rawYear = toInt(searchPar.get('year'));
  const urlMonth = rawMonth >= 1 && rawMonth <= 12 ? rawMonth - 1 : NaN;
  const urlYear = rawYear >= 1970 && rawYear <= 2200 ? rawYear : NaN;

  const nowPinned = useMemo(function () { return new Date(); }, []);
  const initialMonth = isNaN(urlMonth) ? nowPinned.getMonth() : urlMonth;
  const initialYear = isNaN(urlYear) ? nowPinned.getFullYear() : urlYear;

  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [viewYear, setViewYear] = useState(initialYear);
  const [live, setLive] = useState(true);
  const [liveBookings, setLiveBookings] = useState(bookings || []);
  const [liveCoffins, setLiveCoffins] = useState(coffins || []);
  const [liveError, setLiveError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clock, setClock] = useState(new Date());
  const inFlight = useRef(false);
  const scopedFetched = useRef(false);

  const visibleMonthDate = useMemo(function () { return new Date(viewYear, viewMonth, 1); }, [viewYear, viewMonth]);
  const monthRange = useMemo(function () {
    return { from: format(startOfMonth(visibleMonthDate), 'yyyy-MM-dd'), to: format(endOfMonth(visibleMonthDate), 'yyyy-MM-dd') };
  }, [visibleMonthDate]);

  useEffect(function () {
    if (!isNaN(urlMonth) && urlMonth !== viewMonth) setViewMonth(urlMonth);
    if (!isNaN(urlYear) && urlYear !== viewYear) setViewYear(urlYear);
  }, [urlMonth, urlYear]);

  const goToMonth = useCallback(function (month, year) {
    let m = Math.trunc(Number(month));
    let y = Math.trunc(Number(year));
    if (!isFinite(m) || !isFinite(y)) return;
    y += Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    y = Math.min(2200, Math.max(1970, y));
    setViewMonth(m); setViewYear(y);
    const next = new URLSearchParams(searchPar);
    next.set('month', String(m + 1));
    next.set('year', String(y));
    setSearchPar(next, { replace: true });
  }, [searchPar, setSearchPar]);

  useEffect(function () {
    if (!scopedFetched.current) setLiveBookings(bookings);
  }, [bookings]);
  useEffect(function () { setLiveCoffins(coffins); }, [coffins]);
  useEffect(function () { const t = setInterval(function () { setClock(new Date()); }, 1000); return function () { clearInterval(t); }; }, []);

  function doFetchOrders() {
    const eps = ['/coffins/orders', '/coffins/orders/list'];
    let idx = 0;
    function next() {
      if (idx >= eps.length) return Promise.resolve([]);
      return api.get(eps[idx], { params: { from: monthRange.from, to: monthRange.to } })
        .then(function (r) {
          const l = toArr(r && r.data);
          if (l.length > 0 || (r && r.data && r.data.success)) return l;
          idx++; return next();
        })
        .catch(function () { idx++; return next(); });
    }
    return next();
  }

  function doFetchCoffins() {
    const ps = getParentTenantSlug(), ti = getTenantId();
    const params = { parent_slug: ps || undefined, tenant_id: ti || undefined };
    const eps = ['/coffins/all-branches', '/coffins/list'];
    let idx = 0;
    function next() {
      if (idx >= eps.length) return Promise.resolve([]);
      return api.get(eps[idx], { params })
        .then(function (r) {
          const l = toArr(r && r.data);
          if (l.length > 0 || (r && r.data && r.data.success)) return l;
          idx++; return next();
        })
        .catch(function () { idx++; return next(); });
    }
    return next();
  }

  const fetchLive = useCallback(function () {
    if (inFlight.current) return Promise.resolve();
    inFlight.current = true; setRefreshing(true);
    return Promise.all([doFetchOrders(), doFetchCoffins()])
      .then(function (res) {
        scopedFetched.current = true;
        setLiveBookings(res[0]);
        if (res[1].length) setLiveCoffins(res[1]);
        setLiveError(null);
      })
      .catch(function (err) {
        setLiveError((err && err.response && err.response.data && err.response.data.message) || (err && err.message) || 'Live refresh failed');
      })
      .finally(function () { inFlight.current = false; setRefreshing(false); });
  }, [monthRange.from, monthRange.to]);

  useEffect(function () {
    fetchLive();
    const t = setInterval(function () { if (live) fetchLive(); }, 30000);
    const onVis = function () { if (document.visibilityState === 'visible') fetchLive(); };
    document.addEventListener('visibilitychange', onVis);
    return function () { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [fetchLive, live]);

  return {
    viewMonth, viewYear, live, setLive,
    liveBookings, setLiveBookings, liveCoffins, setLiveCoffins,
    liveError, refreshing, clock,
    visibleMonthDate, monthRange, goToMonth, fetchLive,
  };
}

"use client";

import React, { useEffect, useState } from "react"
import { PhoneCall, MapPin, CheckCircle2, Clock, XCircle, ShieldCheck, ShieldX, Loader2 } from "lucide-react"
import { subscribeToTaxiRequests, updateTaxiStatus, requestTaxi } from "@/lib/services/taxi-service"
import { useAuth } from "@/components/providers/auth-provider"
import { checkTaxiEligibility } from "@/lib/services/groq-service"
import type { TaxiRequest } from "@/lib/types"

export function TaxiManagement() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<TaxiRequest[]>([]);
  const [eligibilityMsg, setEligibilityMsg] = useState<string>("");
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const isManagerOrAdmin = profile?.role === "MANAGER" || profile?.role === "ADMIN";

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Listen to real-time taxi requests from Firestore
    const unsubscribe = subscribeToTaxiRequests((data) => {
      setRequests(data);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
    setUpdatingId(id);
    setError("");
    try {
      await updateTaxiStatus(id, status);
    } catch (err: any) {
      setError(err.message || "Failed to update taxi status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRequestTaxi = async (type: "PICKUP" | "DROPOFF") => {
    if (!profile) return;
    setCheckingEligibility(true);
    setEligibilityMsg("");
    try {
      // Fetch the employee's REAL shifts from Firestore shortage responses
      // to check if they accepted an emergency shift today
      const today = new Date().toISOString().split("T")[0];
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      // Check accepted shortage responses today (emergency shift acceptance)
      const responsesSnap = await getDocs(
        query(
          collection(db, "shortageResponses"),
          where("employeeUid", "==", profile.uid),
          where("status", "==", "ACCEPTED")
        )
      );

      // Build a synthetic shift list from accepted shortage alerts today
      const acceptedAlertIds = responsesSnap.docs.map((d) => d.data().alertId);
      const realShifts: any[] = [];

      for (const alertId of acceptedAlertIds) {
        const { getDoc, doc } = await import("firebase/firestore");
        const alertSnap = await getDoc(doc(db, "shortageAlerts", alertId));
        if (alertSnap.exists()) {
          const alert = alertSnap.data();
          if (alert.date === today) {
            realShifts.push({
              id: alertId,
              staffId: profile.uid,
              isEmergency: true,
              startTime: alert.startTime,
              endTime: alert.endTime,
              day: today,
            });
          }
        }
      }

      const { eligible, reason } = await checkTaxiEligibility(
        { type, staffId: profile.uid },
        realShifts
      );
      if (!eligible) {
        setEligibilityMsg(`❌ ${reason}`);
        return;
      }
      await requestTaxi(profile.uid, profile.name || "Unknown Staff", "shift-override", type);
      setEligibilityMsg(`✅ Request submitted. ${reason}`);
    } catch {
      // Fallback: allow request if Groq is unavailable
      await requestTaxi(profile.uid, profile.name || "Unknown Staff", "shift-override", type);
      setEligibilityMsg("✅ Request submitted.");
    } finally {
      setCheckingEligibility(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">Transport Requests</h2>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">{pendingCount} Pending</span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isManagerOrAdmin && (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm mb-4">
          <h3 className="font-semibold mb-4">Need Transport?</h3>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => handleRequestTaxi("PICKUP")}
              disabled={checkingEligibility}
              className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 font-medium disabled:opacity-60 flex items-center gap-2"
            >
              {checkingEligibility ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Request Pick-up
            </button>
            <button
              onClick={() => handleRequestTaxi("DROPOFF")}
              disabled={checkingEligibility}
              className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500/20 font-medium disabled:opacity-60 flex items-center gap-2"
            >
              {checkingEligibility ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Request Drop-off
            </button>
          </div>
          {eligibilityMsg && (
            <p className={`mt-3 text-sm font-medium ${eligibilityMsg.startsWith("❌") ? "text-destructive" : "text-green-500"}`}>
              {eligibilityMsg}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Pick-up: only after accepting an emergency shift · Drop-off: only for shifts ending at 22:00+
          </p>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">No transport requests at the moment.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {requests.map(request => (
            <div key={request.id} className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${request.type === 'PICKUP' ? 'bg-blue-500/20 text-blue-500' : 'bg-orange-500/20 text-orange-500'}`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">{request.staffName}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(request.requestTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase ${request.type === 'PICKUP' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {request.type}
                </span>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                 <span className={`text-sm font-bold ${request.status === 'APPROVED' ? 'text-green-500' : request.status === 'REJECTED' ? 'text-destructive' : 'text-primary'}`}>{request.status}</span>
              </div>

              {isManagerOrAdmin && request.status === "PENDING" && (
                <div className="flex gap-3 mt-4">
                  <button onClick={() => handleStatusUpdate(request.id, "APPROVED")} disabled={updatingId === request.id} className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    {updatingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
                  </button>
                  <button onClick={() => handleStatusUpdate(request.id, "REJECTED")} disabled={updatingId === request.id} className="flex-1 bg-destructive/10 text-destructive font-semibold py-2.5 rounded-xl hover:bg-destructive/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CarFrontIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.64 5H8.4a2 2 0 0 0-1.9 1.3L5 10 3 8" />
      <path d="M7 14h.01" />
      <path d="M17 14h.01" />
      <rect width="18" height="8" x="3" y="10" rx="2" />
      <path d="M5 18v2" />
      <path d="M19 18v2" />
    </svg>
  )
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}

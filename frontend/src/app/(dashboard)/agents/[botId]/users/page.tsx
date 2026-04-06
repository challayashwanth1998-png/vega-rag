"use client";
import { use, useState, useCallback } from "react";
import useSWR from "swr";
import { api, TableRecord } from "@/lib/api";
import {
  Users, UserPlus, Loader2, Trash2, Shield, Database,
  ChevronDown, ChevronUp, Check, X, Lock, Unlock, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── tiny toggle switch ───────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // prevent click bubbling to parent card's onClick
        if (!disabled) onChange();
      }}
      disabled={disabled}
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
        checked ? "bg-indigo-600" : "bg-slate-200"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ─── per-user access panel ────────────────────────────────────────────────── */
function UserAccessPanel({ user, botId, tables, onDelete }: {
  user: any; botId: string; tables: TableRecord[]; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [localRestricted, setLocalRestricted] = useState<Set<string> | null>(null); // null = not loaded

  // fetch restrictions when panel is opened
  const { data: restrictionData, mutate: mutateRestrictions } = useSWR(
    expanded ? `${botId}/users/${user.email}/restrictions` : null,
    () => api.agents.getUserRestrictions(botId, user.email),
    {
      onSuccess: (d) => {
        if (localRestricted === null)
          setLocalRestricted(new Set(d.restricted_tables));
      },
    }
  );

  const restricted = localRestricted ?? new Set<string>(restrictionData?.restricted_tables ?? []);
  const allowedCount = tables.length - restricted.size;

  const toggle = (filename: string) => {
    setLocalRestricted(prev => {
      const next = new Set(prev ?? new Set(restrictionData?.restricted_tables ?? []));
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  };

  const saveRestrictions = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await api.agents.updateUserRestrictions(botId, user.email, [...restricted]);
      await mutateRestrictions();
    } catch (e: any) {
      setSaveError(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const isDirty = restrictionData &&
    JSON.stringify([...restricted].sort()) !== JSON.stringify([...(restrictionData.restricted_tables ?? [])].sort());

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="border border-slate-100 rounded-2xl overflow-hidden bg-white hover:border-indigo-200 transition-colors"
    >
      {/* user row */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{user.email}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              Added {new Date(user.createdAt).toLocaleDateString()}
              {tables.length > 0 && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  allowedCount === tables.length
                    ? "bg-emerald-100 text-emerald-700"
                    : allowedCount === 0
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {allowedCount === tables.length ? (
                    <><Unlock className="w-3 h-3" /> Full Access</>
                  ) : allowedCount === 0 ? (
                    <><Lock className="w-3 h-3" /> No Access</>
                  ) : (
                    <><Shield className="w-3 h-3" /> {allowedCount}/{tables.length} Sources</>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tables.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
            >
              <Shield className="w-3.5 h-3.5" />
              Data Access
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Revoke access"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded access panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">Data Source Access</span>
                  <span className="text-xs text-slate-500">Toggle ON = user can query this source</span>
                </div>
                <div className="flex items-center gap-2">
                  {saveError && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {saveError}
                    </span>
                  )}
                  <button
                    onClick={saveRestrictions}
                    disabled={saving || !isDirty}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isDirty
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Table grid */}
              {!restrictionData && (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              )}
              {tables.length === 0 && (
                <p className="text-sm text-slate-400 py-2">No data tables have been uploaded for this agent yet.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tables.map((tbl) => {
                  const allowed = !restricted.has(tbl.filename);
                  return (
                    <div
                      key={tbl.SK}
                      onClick={() => restrictionData && toggle(tbl.filename)}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition select-none ${
                        restrictionData ? "cursor-pointer" : "cursor-default"
                      } ${
                        allowed
                          ? "bg-white border-emerald-200 hover:border-emerald-400"
                          : "bg-slate-100 border-slate-200 hover:border-slate-300 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black ${
                          allowed ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                        }`}>
                          {tbl.filename.split(".").pop()?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{tbl.table_name}</p>
                          <p className="text-xs text-slate-400 truncate">{tbl.row_count.toLocaleString()} rows · {tbl.columns.length} columns</p>
                        </div>
                      </div>
                      <Toggle
                        checked={allowed}
                        onChange={() => toggle(tbl.filename)}
                        disabled={!restrictionData}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              {tables.length > 0 && restrictionData && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setLocalRestricted(new Set())}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 transition"
                  >
                    <Unlock className="w-3 h-3" /> Allow All
                  </button>
                  <button
                    onClick={() => setLocalRestricted(new Set(tables.map(t => t.filename)))}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                  >
                    <Lock className="w-3 h-3" /> Restrict All
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── main page ────────────────────────────────────────────────────────────── */
export default function UsersPage({ params }: { params: any }) {
  const resolvedParams: any = use(params);
  const botId = resolvedParams.botId;

  const { data: users, mutate } = useSWR(
    botId ? `${botId}/users` : null,
    () => api.agents.getUsers(botId)
  );

  const { data: tables = [] } = useSWR(
    botId ? `${botId}/tables` : null,
    () => api.agents.listTables(botId)
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const handleAddUser = async (e: any) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setAddError("");
    try {
      await api.agents.addUser(botId, email, password);
      setEmail("");
      setPassword("");
      mutate();
    } catch (err: any) {
      setAddError(err.message || "Failed to add user");
    }
    setIsSubmitting(false);
  };

  const handleRevoke = async (targetEmail: string) => {
    if (!confirm(`Revoke access for ${targetEmail}?`)) return;
    try {
      await api.agents.deleteUser(botId, targetEmail);
      mutate();
    } catch (err: any) {
      alert("Failed to revoke: " + err.message);
    }
  };

  const tablesList: TableRecord[] = (tables || []);

  return (
    <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          End-User Access Control
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Invite users and control which data sources each user can query.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Users", value: users?.length ?? "—", icon: <Users className="w-5 h-5" />, color: "indigo" },
          { label: "Data Sources", value: tablesList.length, icon: <Database className="w-5 h-5" />, color: "violet" },
          { label: "Full Access", value: users?.filter((u: any) => !(u.restricted_tables?.length)).length ?? "—", icon: <Unlock className="w-5 h-5" />, color: "emerald" },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm`}>
            <div className={`w-10 h-10 rounded-xl bg-${s.color}-100 text-${s.color}-600 flex items-center justify-center`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ADD USER FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-8">
            <h2 className="font-bold text-slate-800 text-lg mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <UserPlus className="w-5 h-5 text-indigo-500" /> Invite User
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@company.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Initial Password
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>
              {addError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {addError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {isSubmitting ? "Adding…" : "Grant Access"}
              </button>
            </form>

            {/* Data sources info */}
            {tablesList.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Available Data Sources
                </p>
                <div className="space-y-1.5">
                  {tablesList.map(t => (
                    <div key={t.SK} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">
                        {t.filename.split(".").pop()?.toUpperCase()}
                      </span>
                      <span className="truncate font-medium">{t.table_name}</span>
                      <span className="ml-auto text-slate-400">{t.row_count.toLocaleString()} rows</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tablesList.length === 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-400">
                <Database className="w-5 h-5 mx-auto mb-1 opacity-40" />
                No tables uploaded yet. Upload CSV/Excel files in Data Sources to enable access control.
              </div>
            )}
          </div>
        </div>

        {/* USER LIST */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-lg">Active Users</h2>
            <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
              {users?.length || 0} Registered
            </span>
          </div>

          {!users && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          )}
          {users?.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No end-users yet.</p>
              <p className="text-sm text-slate-400 mt-1">Invite users using the form on the left.</p>
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence>
              {users?.map((u: any) => (
                <UserAccessPanel
                  key={u.SK}
                  user={u}
                  botId={botId}
                  tables={tablesList}
                  onDelete={() => handleRevoke(u.email)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  X,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import {
  fetchAdminRelations,
  createPersonalUser,
} from "../../../store/slices/authSlice.js";
import toast from "../../../utils/Toast.js";

export default function AdminUserAssigned() {
  const dispatch = useDispatch();
  const { relations, relationsLoading } = useSelector((state) => state.auth);
  const [search, setSearch] = useState("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadRelations = () => {
    dispatch(fetchAdminRelations())
      .unwrap()
      .catch((err) => toast.error(err || "Failed to load assigned users."));
  };

  useEffect(() => {
    loadRelations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      return toast.error("All fields are required");
    }
    try {
      setSubmitting(true);
      await dispatch(createPersonalUser({ email, password, name })).unwrap();
      toast.success("Personal user created and linked successfully");
      setName("");
      setEmail("");
      setPassword("");
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err || "Failed to create personal user");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRelations = (relations || []).filter((rel) => {
    return (
      rel?.name?.toLowerCase().includes(search.toLowerCase()) ||
      rel?.email?.toLowerCase().includes(search.toLowerCase()) ||
      rel?.unique_id?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 select-none">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-(--text-primary) tracking-tight flex items-center gap-2">
            Assigned Users
          </h1>
          <p className="text-xs text-(--text-secondary) font-medium mt-1">
            Create, manage, and audit all personal users linked to your
            administrator profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRelations}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-black text-(--text-primary) hover:border-(--primary) transition active:scale-95 cursor-pointer shadow-xs"
          >
            <RefreshCw
              size={12}
              className={relationsLoading ? "animate-spin" : ""}
            />
            Reload List
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-(--primary) text-(--text-inverse) text-xs font-black hover:opacity-90 transition active:scale-95 cursor-pointer shadow-md"
          >
            <Plus size={14} />
            Add Personal User
          </button>
        </div>
      </div>

      {/* Main listing panel */}
      <div className="p-8 rounded-3xl bg-(--bg-primary) border border-(--border) space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-secondary)"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name, email, or unique ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-semibold text-(--text-primary) focus:border-(--primary) transition shadow-xs"
          />
        </div>

        {/* Relations representation */}
        {relationsLoading && relations.length === 0 ? (
          <div className="text-center py-10 text-xs text-(--text-secondary) flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-(--primary)" size={16} />
            Querying database records...
          </div>
        ) : filteredRelations.length === 0 ? (
          <div className="text-center py-10 text-xs text-(--text-secondary)">
            No matching user profiles found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-(--border) text-(--text-secondary) font-bold">
                  <th className="pb-3 font-black">User Profile</th>
                  <th className="pb-3 font-black">Unique ID</th>
                  <th className="pb-3 font-black">Role</th>
                  <th className="pb-3 font-black">Organization ID</th>
                  <th className="pb-3 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)/60">
                {filteredRelations.map((relation) => {
                  return (
                    <tr
                      key={relation.unique_id}
                      className="text-(--text-primary)"
                    >
                      <td className="py-4">
                        <div className="font-extrabold">
                          {relation.name || "N/A"}
                        </div>
                        <div className="text-[10px] text-(--text-secondary) font-mono">
                          {relation.email || "N/A"}
                        </div>
                      </td>
                      <td className="py-4 font-mono font-bold text-(--primary)">
                        {relation.unique_id || "N/A"}
                      </td>
                      <td className="py-4">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                          personal
                        </span>
                      </td>
                      <td className="py-4 font-mono text-[10px] text-(--text-secondary)">
                        {relation.relation_id || "N/A"}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() =>
                            toast.success(`Viewing details for ${relation.name}`)
                          }
                          className="p-2 rounded-lg bg-(--bg-secondary) border border-(--border) text-(--text-primary) hover:border-(--primary) hover:text-(--primary) transition cursor-pointer"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over or Popup Modal for adding a user */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-(--border) bg-(--bg-primary) shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-(--text-primary)">
                Add Personal User
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg border border-(--border) text-(--text-secondary) hover:text-(--text-primary) bg-(--bg-primary) transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-(--text-secondary)">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-semibold text-(--text-primary) focus:border-(--primary) transition"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-(--text-secondary)">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-semibold text-(--text-primary) focus:border-(--primary) transition"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-(--text-secondary)">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-semibold text-(--text-primary) focus:border-(--primary) transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-(--text-secondary) hover:text-(--text-primary) transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-(--primary) text-(--text-inverse) text-xs font-bold hover:opacity-90 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Creating User Account...
                  </>
                ) : (
                  "Create & Link Account"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

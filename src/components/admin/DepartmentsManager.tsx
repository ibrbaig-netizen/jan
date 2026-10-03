import React, { useState } from 'react';
import {
  Check,
  Edit2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { DepartmentInfo } from '../../types';

export const DepartmentsManager: React.FC = () => {
  const { departments, addDepartment, updateDepartment, deleteDepartment, products, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [editingDept, setEditingDept] = useState<DepartmentInfo | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<DepartmentInfo | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setDisplayOrder(departments.length + 1);
    setIsActive(true);
    setEditingDept(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentInfo) => {
    setEditingDept(dept);
    setName(dept.name);
    setSlug(String(dept.id));
    setDescription(dept.description || '');
    setImageUrl(dept.image || '');
    setDisplayOrder(dept.displayOrder ?? 0);
    setIsActive(dept.isActive !== false);
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Department name is required.', 'warning');
      return;
    }

    const cleanSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingDept) {
      await updateDepartment(String(editingDept.id), {
        name: name.trim(),
        description: description.trim(),
        image: imageUrl.trim() || undefined,
        displayOrder,
        isActive
      });
      showToast(`Department "${name}" updated successfully!`, 'success');
    } else {
      await addDepartment({
        name: name.trim(),
        shortName: name.trim().split(' ')[0] || name.trim(),
        slug: cleanSlug,
        description: description.trim(),
        iconName: 'Package',
        bgGradient: 'from-emerald-600 to-teal-700',
        accentColor: '#059669',
        sampleCategories: [],
        image: imageUrl.trim() || '/departments/food-staples.svg',
        displayOrder,
        isActive
      });
    }

    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    await deleteDepartment(String(deptToDelete.id));
    setDeptToDelete(null);
  };

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    String(d.id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Department Categories Manager ({departments.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, edit, toggle visibility, and organize storefront navigation categories in Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Department</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search departments..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Icon / Image</th>
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Products</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredDepts.map(dept => {
                const count = products.filter(p => p.department === dept.id).length;
                return (
                  <tr key={String(dept.id)} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      #{dept.displayOrder ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                        {dept.image ? (
                          <img src={dept.image} alt={dept.name} className="w-full h-full object-cover" />
                        ) : (
                          <Layers className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{dept.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{dept.description}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-purple-700 font-semibold">
                      {String(dept.id)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {count} items
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => updateDepartment(String(dept.id), { isActive: dept.isActive === false ? true : false })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                          dept.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-300'
                        }`}
                      >
                        {dept.isActive !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{dept.isActive !== false ? 'Active' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(dept)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Edit department"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeptToDelete(dept)}
                          className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Delete department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {editingDept ? 'Edit Department' : 'Create New Department'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!editingDept) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  placeholder="e.g. Baby Care & Diapers"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slug (URL identifier)
                </label>
                <input
                  type="text"
                  value={slug}
                  disabled={Boolean(editingDept)}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="e.g. baby-care"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono disabled:opacity-60 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Tagline
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief tagline for customers browsing this section..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image URL / SVG Path
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="/departments/baby-care.svg or image URL"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={e => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Visibility
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={e => setIsActive(e.target.value === 'true')}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow"
                >
                  {editingDept ? 'Update Department' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <h3 className="font-extrabold text-sm text-slate-900">
              Delete Department "{deptToDelete.name}"?
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Existing products in this department will remain in the catalog with their department unlinked.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

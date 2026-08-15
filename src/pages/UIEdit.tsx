import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Image as ImageIcon,
    LayoutGrid,
    BookOpen,
    Mail,
    PanelBottom,
    Upload,
    Loader2,
    ImagePlus,
    RotateCcw,
    Save,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CONTENT_SECTIONS } from '../types/index';
import type { SiteContent, ContentSection } from '../types/index';
import {
    getSiteContent,
    updateSiteContent,
    uploadImages,
    MAX_UPLOAD_BYTES,
    ALLOWED_IMAGE_MIME,
} from '../api/adminService';
import toast from 'react-hot-toast';

const SECTION_META: Record<ContentSection, { label: string; icon: LucideIcon; blurb: string }> = {
    hero: { label: 'Hero', icon: ImageIcon, blurb: 'The full-screen banner at the top of the home page' },
    collections: { label: 'Collections', icon: LayoutGrid, blurb: 'The heading above the product grid' },
    about: { label: 'About', icon: BookOpen, blurb: 'The About page: banner, story and value pillars' },
    contact: { label: 'Contact', icon: Mail, blurb: 'The Contact page: boutique details, map, hours and form' },
    footer: { label: 'Footer', icon: PanelBottom, blurb: 'The site-wide footer' },
};

const UIEdit = () => {
    const [fields, setFields] = useState<SiteContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<ContentSection>('hero');

    // name -> edited value. Only entries that differ from the server live here,
    // so the save bar's count is always the true number of pending changes.
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    const [uploadingName, setUploadingName] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadTargetRef = useRef<string | null>(null);

    const loadContent = async () => {
        setLoading(true);
        try {
            setFields(await getSiteContent());
            setDrafts({});
        } catch {
            toast.error('Failed to load site content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, []);

    const valueOf = (field: SiteContent) => drafts[field.name] ?? field.text;

    const setDraft = (field: SiteContent, next: string) => {
        setDrafts((prev) => {
            const copy = { ...prev };
            // Typing a value back to its original removes it from the dirty set.
            if (next === field.text) delete copy[field.name];
            else copy[field.name] = next;
            return copy;
        });
    };

    const dirtyNames = Object.keys(drafts);

    const countsBySection = useMemo(() => {
        const counts = {} as Record<ContentSection, number>;
        for (const section of CONTENT_SECTIONS) counts[section] = 0;
        for (const field of fields) {
            if (counts[field.section] !== undefined) counts[field.section] += 1;
        }
        return counts;
    }, [fields]);

    // Preserves the backend's sort_order while collecting fields under their group.
    const groupsForActiveTab = useMemo(() => {
        const groups: { label: string | null; items: SiteContent[] }[] = [];
        for (const field of fields.filter((f) => f.section === activeTab)) {
            const last = groups[groups.length - 1];
            if (last && last.label === (field.groupLabel ?? null)) last.items.push(field);
            else groups.push({ label: field.groupLabel ?? null, items: [field] });
        }
        return groups;
    }, [fields, activeTab]);

    const openFilePicker = (name: string) => {
        uploadTargetRef.current = name;
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        const target = uploadTargetRef.current;
        if (!file || !target) return;

        if (file.size > MAX_UPLOAD_BYTES) {
            setUploadError(`"${file.name}" is larger than 5 MB`);
            return;
        }
        if (!ALLOWED_IMAGE_MIME.test(file.type)) {
            setUploadError(`"${file.name}" is not a JPEG, PNG, WebP or GIF`);
            return;
        }

        setUploadError('');
        setUploadingName(target);
        try {
            const urls = await uploadImages([file]);
            const field = fields.find((f) => f.name === target);
            // Staged as a draft like any other edit, so nothing changes on the
            // storefront until Save is pressed.
            if (field && urls[0]) setDraft(field, urls[0]);
        } catch {
            setUploadError('Upload failed. Please try again.');
        } finally {
            setUploadingName(null);
            uploadTargetRef.current = null;
        }
    };

    const handleSave = async () => {
        if (dirtyNames.length === 0) return;
        setSaving(true);
        try {
            const updated = await updateSiteContent(
                dirtyNames.map((name) => ({ name, text: drafts[name] }))
            );
            setFields(updated);
            setDrafts({});
        } catch {
            // adminService already surfaced the server's message.
        } finally {
            setSaving(false);
        }
    };

    const renderField = (field: SiteContent) => {
        const value = valueOf(field);
        const isDirty = field.name in drafts;
        const inputClass =
            'w-full p-3 border text-sm focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold outline-none transition-all placeholder:text-gray-300 ' +
            (isDirty ? 'border-champagne-gold bg-champagne-gold/5' : 'border-gray-200');

        return (
            <div key={field.name} className="space-y-2">
                <div className="flex items-baseline justify-between gap-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {field.label}
                    </label>
                    <span className="text-[10px] text-gray-300 font-mono">{field.name}</span>
                </div>

                {field.type === 'image' ? (
                    <div className="flex gap-4 items-start">
                        <div className="h-24 w-24 flex-shrink-0 bg-gray-50 overflow-hidden border border-gray-100">
                            {value ? (
                                <img src={value} alt={field.label} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-300">
                                    <ImagePlus size={20} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <button
                                type="button"
                                onClick={() => openFilePicker(field.name)}
                                disabled={uploadingName !== null}
                                className="flex items-center gap-2 px-4 py-2 border border-champagne-gold text-champagne-gold text-xs font-bold uppercase tracking-widest hover:bg-champagne-gold hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {uploadingName === field.name ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Upload size={14} />
                                )}
                                {uploadingName === field.name ? 'Uploading…' : 'Replace Image'}
                            </button>
                            <p className="text-xs text-gray-400">JPEG, PNG, WebP or GIF · up to 5 MB</p>
                        </div>
                    </div>
                ) : field.type === 'textarea' ? (
                    <textarea
                        value={value}
                        onChange={(e) => setDraft(field, e.target.value)}
                        rows={4}
                        className={`${inputClass} resize-none`}
                    />
                ) : (
                    <input
                        value={value}
                        onChange={(e) => setDraft(field, e.target.value)}
                        className={inputClass}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            <div>
                <h2 className="text-3xl font-serif text-deep-black">UI Edit</h2>
                <p className="text-gray-500 mt-1">Edit the text and imagery shown on the storefront</p>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelected}
                className="hidden"
            />

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {CONTENT_SECTIONS.map((section) => {
                    const { label, icon: Icon } = SECTION_META[section];
                    return (
                        <button
                            key={section}
                            onClick={() => setActiveTab(section)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === section
                                    ? 'border-champagne-gold text-deep-black'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <Icon size={16} />
                            {label.toUpperCase()}
                            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                {countsBySection[section] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            <p className="text-sm text-gray-500 -mt-4">{SECTION_META[activeTab].blurb}</p>

            {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}

            {loading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-sm"></div>
                    ))}
                </div>
            ) : groupsForActiveTab.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    No editable content in this section yet.
                </div>
            ) : (
                <div className="space-y-8">
                    {groupsForActiveTab.map((group, i) => (
                        <div key={group.label ?? `group-${i}`} className="bg-white border border-gray-100 shadow-sm p-6 space-y-6">
                            {group.label && (
                                <h3 className="text-xs font-bold text-champagne-gold uppercase tracking-widest border-b border-gray-100 pb-3">
                                    {group.label}
                                </h3>
                            )}
                            {group.items.map(renderField)}
                        </div>
                    ))}
                </div>
            )}

            {/* Save bar — spans every tab, so edits made across sections save together */}
            {dirtyNames.length > 0 && (
                <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)] px-8 py-4 flex items-center justify-between z-40">
                    <p className="text-sm text-gray-600">
                        <span className="font-bold text-deep-black">{dirtyNames.length}</span> unsaved
                        {dirtyNames.length === 1 ? ' change' : ' changes'}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setDrafts({})}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                        >
                            <RotateCcw size={14} />
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-deep-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UIEdit;

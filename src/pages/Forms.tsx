import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createGoogleForm, updateFormBatch, fetchRecentDriveFiles, deleteDriveFile } from '../lib/googleApi';
import { generateFormStructure, editFormStructureWithAI } from '../lib/gemini';
import { cn } from '../lib/utils';
import {
  Plus,
  Send,
  Loader2,
  ExternalLink,
  Search,
  Trash2,
  Clock,
  X,
  Eye,
  EyeOff,
  ChevronLeft,
  SortAsc,
  SortDesc,
  ArrowRight,
  GripVertical,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { fetchGoogleForm } from '../lib/googleApi';

export function Forms() {
  const { accessToken, signIn } = useAuth();

  const [activeTab, setActiveTab] = useState<'builder' | 'management'>('builder');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdFormUrl, setCreatedFormUrl] = useState<string | null>(null);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingWithAI, setIsEditingWithAI] = useState(false);

  const [userForms, setUserForms] = useState<any[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [formSortBy, setFormSortBy] = useState<'name' | 'modifiedTime' | 'createdTime'>('modifiedTime');
  const [formSortOrder, setFormSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (activeTab === 'management' && accessToken) loadUserForms();
  }, [activeTab, accessToken, formSortBy, formSortOrder]);

  const loadUserForms = async () => {
    setIsLoadingForms(true);
    try {
      const forms = await fetchRecentDriveFiles(
        accessToken!,
        "mimeType = 'application/vnd.google-apps.form' and trashed = false",
        `${formSortBy} ${formSortOrder}`
      );
      setUserForms(forms);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleEditExistingForm = async (formId: string) => {
    if (!accessToken) return;
    setIsLoadingForms(true);
    try {
      const formData = await fetchGoogleForm(accessToken, formId);
      const internalStructure = {
        title: formData.info.title || 'Untitled Form',
        description: formData.info.description || '',
        items: (formData.items || []).map((item: any) => {
          let type = 'TEXT';
          let options: string[] = [];
          if (item.questionItem) {
            const q = item.questionItem.question;
            if (q.choiceQuestion) {
              type = q.choiceQuestion.type === 'RADIO' ? 'CHOICE' : 'CHECKBOX';
              options = q.choiceQuestion.options?.map((o: any) => o.value) || [];
            } else if (q.scaleQuestion) {
              type = 'SCALE';
            }
          }
          return {
            id: item.itemId,
            title: item.title || 'Untitled Question',
            type,
            options,
            required: item.questionItem?.question?.required || false,
          };
        }),
      };
      setGeneratedForm(internalStructure);
      setEditingFormId(formId);
      setActiveTab('builder');
    } catch (error) {
      console.error('Error fetching form structure:', error);
      alert('Failed to load form for editing.');
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleDeleteForm = async (fileId: string) => {
    if (!window.confirm('Delete this form?')) return;
    try {
      await deleteDriveFile(accessToken!, fileId);
      setUserForms(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      alert('Failed to delete form.');
    }
  };

  const filteredForms = userForms.filter(f =>
    f.name.toLowerCase().includes(formSearchQuery.toLowerCase())
  );

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setCreatedFormUrl(null);
    try {
      const structure = await generateFormStructure(prompt);
      setGeneratedForm({
        ...structure,
        items: structure.items.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substring(7),
        })),
      });
    } catch (error) {
      alert('Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !generatedForm) return;
    setIsEditingWithAI(true);
    try {
      const updatedStructure = await editFormStructureWithAI(generatedForm, editPrompt);
      setGeneratedForm({
        ...updatedStructure,
        items: updatedStructure.items?.map((item: any) => ({
          ...item,
          id: item.id || Math.random().toString(36).substring(7),
        })) || [],
      });
      setEditPrompt('');
    } catch (error) {
      alert('Failed to edit form.');
    } finally {
      setIsEditingWithAI(false);
    }
  };

  const handleCreateOnGoogle = async () => {
    if (!accessToken) { await signIn(); return; }
    if (!generatedForm) return;
    setIsCreating(true);
    try {
      let formId = editingFormId;
      const requests: any[] = [];

      if (!formId) {
        const form = await createGoogleForm(accessToken, generatedForm.title);
        formId = form.formId;
      } else {
        const currentForm = await fetchGoogleForm(accessToken, formId);
        if (currentForm.items) {
          for (let i = currentForm.items.length - 1; i >= 0; i--) {
            requests.push({ deleteItem: { location: { index: i } } });
          }
        }
      }

      requests.push({
        updateFormInfo: {
          info: { title: generatedForm.title, description: generatedForm.description },
          updateMask: 'title,description',
        },
      });

      generatedForm.items.forEach((item: any, index: number) => {
        const createItem: any = {
          createItem: {
            item: {
              title: item.title,
              questionItem: { question: { required: item.required || false } },
            },
            location: { index },
          },
        };
        if (item.type === 'TEXT') {
          createItem.createItem.item.questionItem.question.textQuestion = { paragraph: true };
        } else if (item.type === 'CHOICE') {
          createItem.createItem.item.questionItem.question.choiceQuestion = {
            type: 'RADIO',
            options: item.options.map((o: string) => ({ value: o })),
          };
        } else if (item.type === 'CHECKBOX') {
          createItem.createItem.item.questionItem.question.choiceQuestion = {
            type: 'CHECKBOX',
            options: item.options.map((o: string) => ({ value: o })),
          };
        } else if (item.type === 'SCALE') {
          createItem.createItem.item.questionItem.question.scaleQuestion = { low: 1, high: 5 };
        }
        requests.push(createItem);
      });

      await updateFormBatch(accessToken, formId!, requests);
      setCreatedFormUrl(`https://docs.google.com/forms/d/${formId}/edit`);
      setGeneratedForm(null);
      setEditingFormId(null);
      setPrompt('');
    } catch (error) {
      alert('Failed to save form on Google.');
    } finally {
      setIsCreating(false);
    }
  };

  const updateItem = (id: string, updates: any) => {
    setGeneratedForm((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) => item.id === id ? { ...item, ...updates } : item),
    }));
  };

  const removeItem = (id: string) => {
    setGeneratedForm((prev: any) => ({
      ...prev,
      items: prev.items.filter((item: any) => item.id !== id),
    }));
  };

  const addItem = () => {
    setGeneratedForm((prev: any) => ({
      ...prev,
      items: [...prev.items, {
        id: Math.random().toString(36).substring(7),
        title: 'New Question',
        type: 'TEXT',
        required: false,
      }],
    }));
  };

  const TYPE_LABEL: Record<string, string> = {
    TEXT: 'Text',
    CHOICE: 'Multiple Choice',
    CHECKBOX: 'Checkbox',
    SCALE: 'Scale',
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted">Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Forms</h1>
          <p className="text-sm text-muted">Generate and publish Google Forms with AI.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border gap-6">
          {(['builder', 'management'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted hover:text-foreground'
              )}
            >
              {tab === 'builder' ? 'AI Builder' : 'My Forms'}
            </button>
          ))}
        </div>

        {/* ── BUILDER ── */}
        {activeTab === 'builder' && (
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {!generatedForm && !createdFormUrl && (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-4"
                >
                  <form onSubmit={handleGenerate} className="border border-border rounded-sm bg-background overflow-hidden">
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Describe the form you need — e.g. Job application form for a senior designer role with portfolio and salary questions."
                      className="w-full h-28 p-5 bg-transparent text-sm text-foreground outline-none resize-none placeholder:text-muted leading-relaxed"
                      disabled={isGenerating}
                    />
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface">
                      <span className="text-xs text-muted">AI will generate a complete form structure</span>
                      <button
                        type="submit"
                        disabled={isGenerating || !prompt.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-sm hover:bg-foreground-hover transition-colors disabled:opacity-40"
                      >
                        {isGenerating ? <><Loader2 size={13} className="animate-spin" /> Generating...</> : 'Generate Form'}
                      </button>
                    </div>
                  </form>

                  {/* Example prompts */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Customer satisfaction survey',
                      'Job application for product designer',
                      'Event registration form',
                      'Employee onboarding checklist',
                    ].map(ex => (
                      <button
                        key={ex}
                        onClick={() => setPrompt(ex)}
                        className="px-3 py-1.5 text-xs text-muted border border-border rounded-sm hover:bg-surface hover:text-foreground transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            {createdFormUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-border rounded-sm p-10 text-center bg-background"
              >
                <div className="w-10 h-10 border border-border rounded-sm flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={18} className="text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Form Published</h3>
                <p className="text-sm text-muted mb-7 max-w-xs mx-auto leading-relaxed">
                  Your Google Form is live and ready to share or edit.
                </p>
                <div className="flex items-center gap-3 justify-center">
                  <a
                    href={createdFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-semibold rounded-sm hover:bg-foreground-hover transition-colors"
                  >
                    Open in Google Forms
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => { setCreatedFormUrl(null); setPrompt(''); }}
                    className="px-5 py-2.5 border border-border text-xs font-semibold rounded-sm hover:bg-surface transition-colors text-foreground"
                  >
                    New Form
                  </button>
                </div>
              </motion.div>
            )}

            {/* Form editor */}
            {generatedForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* AI edit bar */}
                <div className="border border-border rounded-sm bg-surface px-4 py-3">
                  <form onSubmit={handleEditWithAI} className="flex gap-2">
                    <input
                      type="text"
                      value={editPrompt}
                      onChange={e => setEditPrompt(e.target.value)}
                      placeholder="Refine with AI — e.g. Add a portfolio link question, make salary required..."
                      className="flex-1 bg-background border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-border-strong transition-colors text-foreground placeholder:text-muted"
                      disabled={isEditingWithAI}
                    />
                    <button
                      type="submit"
                      disabled={isEditingWithAI || !editPrompt.trim()}
                      className="px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-sm hover:bg-foreground-hover transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                    >
                      {isEditingWithAI ? <Loader2 size={13} className="animate-spin" /> : null}
                      Apply
                    </button>
                  </form>
                </div>

                {/* Form header */}
                <div className="border border-border rounded-sm bg-background">
                  <div className="p-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                      <div className="flex-1 space-y-2">
                        {editingFormId && (
                          <button
                            onClick={() => { setEditingFormId(null); setGeneratedForm(null); }}
                            className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-1"
                          >
                            <ChevronLeft size={12} /> Back to builder
                          </button>
                        )}
                        <input
                          type="text"
                          value={generatedForm.title}
                          onChange={e => setGeneratedForm({ ...generatedForm, title: e.target.value })}
                          className="text-xl font-semibold text-foreground bg-transparent border-none outline-none w-full placeholder:text-muted"
                          placeholder="Form Title"
                        />
                        <input
                          type="text"
                          value={generatedForm.description}
                          onChange={e => setGeneratedForm({ ...generatedForm, description: e.target.value })}
                          className="text-sm text-muted bg-transparent border-none outline-none w-full placeholder:text-muted/50"
                          placeholder="Description"
                        />
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setIsPreviewMode(!isPreviewMode)}
                          className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-medium rounded-sm hover:bg-surface transition-colors text-foreground"
                        >
                          {isPreviewMode ? <EyeOff size={13} /> : <Eye size={13} />}
                          {isPreviewMode ? 'Edit' : 'Preview'}
                        </button>
                        <button
                          onClick={handleCreateOnGoogle}
                          disabled={isCreating}
                          className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-sm hover:bg-foreground-hover transition-colors disabled:opacity-40"
                        >
                          {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          {editingFormId ? 'Save Changes' : 'Publish'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="p-4">
                    {isPreviewMode ? (
                      <div className="space-y-6 max-w-xl mx-auto py-4">
                        {generatedForm.items.map((item: any, i: number) => (
                          <div key={item.id} className="space-y-3">
                            <label className="block text-sm font-medium text-foreground">
                              {item.title}
                              {item.required && <span className="text-muted ml-1">*</span>}
                            </label>
                            {item.type === 'TEXT' && (
                              <textarea
                                placeholder="Your answer"
                                className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none resize-none h-20 placeholder:text-muted"
                              />
                            )}
                            {(item.type === 'CHOICE' || item.type === 'CHECKBOX') && (
                              <div className="space-y-2">
                                {item.options.map((opt: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    <div className={cn(
                                      'w-4 h-4 border border-border',
                                      item.type === 'CHOICE' ? 'rounded-full' : 'rounded-sm'
                                    )} />
                                    <span className="text-sm text-foreground-muted">{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {item.type === 'SCALE' && (
                              <div className="flex items-center gap-4">
                                {[1, 2, 3, 4, 5].map(val => (
                                  <div key={val} className="flex flex-col items-center gap-1.5">
                                    <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-xs text-muted">{val}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <Reorder.Group
                          axis="y"
                          values={generatedForm.items}
                          onReorder={(newItems: any[]) => setGeneratedForm((prev: any) => ({ ...prev, items: newItems }))}
                          className="space-y-2"
                        >
                          {generatedForm.items.map((item: any, index: number) => (
                            <Reorder.Item
                              key={item.id}
                              value={item}
                              className="group border border-border rounded-sm bg-background hover:bg-surface transition-colors"
                            >
                              <div className="flex items-start gap-3 p-4">
                                {/* Drag handle */}
                                <div className="mt-0.5 cursor-grab active:cursor-grabbing text-muted opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
                                  <GripVertical size={14} />
                                </div>

                                {/* Question number */}
                                <div className="w-5 shrink-0 text-[10px] font-bold text-muted text-right pt-0.5">
                                  {String(index + 1).padStart(2, '0')}
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-3 min-w-0">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={e => updateItem(item.id, { title: e.target.value })}
                                    className="w-full text-sm font-medium text-foreground bg-transparent border-none outline-none placeholder:text-muted"
                                    placeholder="Question text"
                                  />

                                  {(item.type === 'CHOICE' || item.type === 'CHECKBOX') && (
                                    <div className="space-y-1.5 pl-1">
                                      {item.options?.map((opt: string, j: number) => (
                                        <div key={j} className="flex items-center gap-2">
                                          <div className={cn('w-3.5 h-3.5 border border-border shrink-0', item.type === 'CHOICE' ? 'rounded-full' : 'rounded-sm')} />
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={e => {
                                              const newOptions = [...item.options];
                                              newOptions[j] = e.target.value;
                                              updateItem(item.id, { options: newOptions });
                                            }}
                                            className="text-sm text-muted bg-transparent border-none outline-none flex-1"
                                          />
                                          <button
                                            onClick={() => updateItem(item.id, { options: item.options.filter((_: any, idx: number) => idx !== j) })}
                                            className="text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => updateItem(item.id, { options: [...(item.options || []), `Option ${(item.options?.length || 0) + 1}`] })}
                                        className="text-xs text-muted hover:text-foreground flex items-center gap-1 mt-1"
                                      >
                                        <Plus size={11} /> Add option
                                      </button>
                                    </div>
                                  )}

                                  {item.type === 'SCALE' && (
                                    <div className="flex items-center gap-3 pl-1">
                                      {[1, 2, 3, 4, 5].map(val => (
                                        <div key={val} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs text-muted">{val}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <select
                                    value={item.type}
                                    onChange={e => updateItem(item.id, { type: e.target.value })}
                                    className="text-[10px] bg-surface border border-border rounded-sm px-2 py-1 text-muted outline-none cursor-pointer"
                                  >
                                    {Object.entries(TYPE_LABEL).map(([val, label]) => (
                                      <option key={val} value={val}>{label}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => updateItem(item.id, { required: !item.required })}
                                    className={cn(
                                      'text-[10px] px-2 py-1 rounded-sm border transition-colors font-medium',
                                      item.required
                                        ? 'border-foreground/30 text-foreground bg-foreground/5'
                                        : 'border-border text-muted hover:border-border-strong'
                                    )}
                                  >
                                    {item.required ? 'Required' : 'Optional'}
                                  </button>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1 text-muted hover:text-foreground transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>

                        <button
                          onClick={addItem}
                          className="w-full mt-3 py-3 border border-dashed border-border rounded-sm text-xs text-muted hover:text-foreground hover:border-border-strong transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={13} />
                          Add Question
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── MANAGEMENT ── */}
        {activeTab === 'management' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={formSearchQuery}
                  onChange={e => setFormSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-sm text-sm outline-none focus:border-border-strong transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border border-border rounded-sm overflow-hidden">
                  {(['name', 'modifiedTime'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setFormSortBy(s)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium transition-colors',
                        formSortBy === s ? 'bg-foreground text-background' : 'text-muted hover:text-foreground bg-background'
                      )}
                    >
                      {s === 'name' ? 'Name' : 'Date'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setFormSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-border rounded-sm text-muted hover:text-foreground bg-background transition-colors"
                >
                  {formSortOrder === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />}
                </button>
                <button
                  onClick={loadUserForms}
                  disabled={isLoadingForms}
                  className="p-2 border border-border rounded-sm text-muted hover:text-foreground bg-background transition-colors disabled:opacity-40"
                >
                  <Clock size={13} className={isLoadingForms ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {isLoadingForms ? (
              <div className="flex items-center justify-center py-20 text-muted gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading forms...</span>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-sm">
                <p className="text-sm font-medium text-foreground">No forms found</p>
                <p className="text-xs text-muted mt-1">
                  {formSearchQuery ? 'No results match your search.' : 'Create your first form in the AI Builder tab.'}
                </p>
                {!formSearchQuery && (
                  <button
                    onClick={() => setActiveTab('builder')}
                    className="mt-5 text-xs font-semibold text-foreground hover:underline flex items-center gap-1 mx-auto"
                  >
                    Get started <Plus size={12} />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-px border border-border rounded-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 bg-surface border-b border-border">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Form</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Modified</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Actions</span>
                </div>
                {filteredForms.map((form, i) => (
                  <div
                    key={form.id}
                    className={cn(
                      'grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 bg-background hover:bg-surface transition-colors group',
                      i < filteredForms.length - 1 && 'border-b border-border'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{form.name}</p>
                    </div>
                    <span className="text-xs text-muted whitespace-nowrap">
                      {new Date(form.modifiedTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditExistingForm(form.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-sm text-xs font-medium text-foreground hover:bg-surface transition-colors"
                      >
                        Edit <ArrowRight size={11} />
                      </button>
                      <a
                        href={form.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-muted hover:text-foreground border border-border rounded-sm transition-colors"
                      >
                        <ExternalLink size={13} />
                      </a>
                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        className="p-1.5 text-muted hover:text-foreground border border-border rounded-sm transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createGoogleForm, updateFormBatch, fetchRecentDriveFiles, deleteDriveFile } from '../lib/googleApi';
import { generateFormStructure, editFormStructureWithAI } from '../lib/gemini';
import { cn } from '../lib/utils';
import { 
  Plus, 
  Send, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  ClipboardList,
  Search,
  Trash2,
  Clock,
  LayoutGrid,
  MoreVertical,
  GripVertical,
  Type,
  List,
  CheckSquare,
  SlidersHorizontal,
  X,
  Eye,
  EyeOff,
  ChevronLeft,
  Filter,
  SortAsc,
  SortDesc,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { fetchGoogleForm, fetchGoogleFormResponses } from '../lib/googleApi';
import { summarizeFormResponses } from '../lib/gemini';
import { BarChart3, Users, RefreshCw, AlertCircle, Award, MessageSquare } from 'lucide-react';
import Markdown from 'react-markdown';

export function Forms() {
  const { accessToken, signIn } = useAuth();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'builder' | 'management'>('builder');

  // Preview Mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Builder/Editor State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdFormUrl, setCreatedFormUrl] = useState<string | null>(null);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingWithAI, setIsEditingWithAI] = useState(false);

  // Management State
  const [userForms, setUserForms] = useState<any[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [formSortBy, setFormSortBy] = useState<'name' | 'modifiedTime' | 'createdTime'>('modifiedTime');
  const [formSortOrder, setFormSortOrder] = useState<'asc' | 'desc'>('desc');

  // Responses Management States
  const [selectedFormForResponses, setSelectedFormForResponses] = useState<any>(null);
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [loadedFormStructure, setLoadedFormStructure] = useState<any>(null);
  const [isResponsesLoading, setIsResponsesLoading] = useState(false);
  const [responsesError, setResponsesError] = useState<string | null>(null);
  const [responsesTab, setResponsesTab] = useState<'summary' | 'individual'>('summary');
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleViewResponses = async (form: any) => {
    setSelectedFormForResponses(form);
    setIsResponsesLoading(true);
    setResponsesError(null);
    setFormResponses([]);
    setLoadedFormStructure(null);
    setSelectedResponseIndex(null);
    setAiAnalysis('');
    setResponsesTab('summary');
    
    try {
      // 1. Fetch Google Form Structure
      const formData = await fetchGoogleForm(accessToken!, form.id);
      
      const internalStructure = {
        title: formData.info.title || 'Untitled Form',
        description: formData.info.description || '',
        items: (formData.items || []).map((item: any) => {
          let type = 'TEXT';
          let options = [];
          
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
            required: item.questionItem?.question?.required || false
          };
        })
      };
      
      setLoadedFormStructure(internalStructure);

      // 2. Fetch Form Responses
      const responsesData = await fetchGoogleFormResponses(accessToken!, form.id);
      setFormResponses(responsesData.responses || []);
    } catch (err: any) {
      console.error("Error loading form responses:", err);
      setResponsesError(err.message || "Failed to load responses or form details.");
    } finally {
      setIsResponsesLoading(false);
    }
  };

  const handleAnalyzeResponses = async () => {
    if (!loadedFormStructure || formResponses.length === 0) return;
    setIsAnalyzing(true);
    setAiAnalysis('');
    try {
      const summary = await summarizeFormResponses(
        loadedFormStructure.title,
        loadedFormStructure.items,
        formResponses
      );
      setAiAnalysis(summary);
    } catch (err: any) {
      setAiAnalysis("Error generating AI responses analysis: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch forms when switching to management tab or sorting changes
  useEffect(() => {
    if (activeTab === 'management' && accessToken) {
      loadUserForms();
    }
  }, [activeTab, accessToken, formSortBy, formSortOrder]);

  const loadUserForms = async () => {
    setIsLoadingForms(true);
    try {
      // Filter for Google Forms mimeType and handle sorting
      const forms = await fetchRecentDriveFiles(
        accessToken!, 
        "mimeType = 'application/vnd.google-apps.form' and trashed = false",
        `${formSortBy} ${formSortOrder}`
      );
      setUserForms(forms);
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleEditExistingForm = async (formId: string) => {
    if (!accessToken) return;
    setIsLoadingForms(true);
    try {
      const formData = await fetchGoogleForm(accessToken, formId);
      
      // Map Google Form structure back to our internal structure
      const internalStructure = {
        title: formData.info.title || 'Untitled Form',
        description: formData.info.description || 'Please fill out this form to help us understand your needs better.',
        items: (formData.items || []).map((item: any) => {
          let type = 'TEXT';
          let options = [];
          
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
            required: item.questionItem?.question?.required || false
          };
        })
      };
      
      setGeneratedForm(internalStructure);
      setEditingFormId(formId);
      setActiveTab('builder');
    } catch (error) {
      console.error("Error fetching form structure:", error);
      alert("Failed to load form for editing.");
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleDeleteForm = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;
    
    try {
      await deleteDriveFile(accessToken!, fileId);
      setUserForms(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error("Error deleting form:", error);
      alert("Failed to delete form.");
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
      // Give each item a unique ID for drag-and-drop
      const structureWithIds = {
        ...structure,
        items: structure.items.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substring(7)
        }))
      };
      setGeneratedForm(structureWithIds);
    } catch (error) {
      console.error("Error generating form:", error);
      alert("Failed to generate form. Please try again.");
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
      // Ensure new items have IDs
      const structureWithIds = {
        ...updatedStructure,
        items: updatedStructure.items?.map((item: any) => ({
          ...item,
          id: item.id || Math.random().toString(36).substring(7)
        })) || []
      };
      setGeneratedForm(structureWithIds);
      setEditPrompt('');
    } catch (error) {
      console.error("Error editing form:", error);
      alert("Failed to edit form. Please try again.");
    } finally {
      setIsEditingWithAI(false);
    }
  };

  const handleCreateOnGoogle = async () => {
    if (!accessToken) {
      await signIn();
      return;
    }

    if (!generatedForm) return;

    setIsCreating(true);
    try {
      let formId = editingFormId;
      
      const requests: any[] = [];

      if (!formId) {
        // Create new form
        const form = await createGoogleForm(accessToken, generatedForm.title);
        formId = form.formId;
      } else {
        // Fetch existing structure to delete current items
        const currentForm = await fetchGoogleForm(accessToken, formId);
        if (currentForm.items) {
          // Delete from end to beginning to avoid index shifts
          for (let i = currentForm.items.length - 1; i >= 0; i--) {
            requests.push({
              deleteItem: {
                location: { index: i }
              }
            });
          }
        }
      }

      // Update info (title and description)
      requests.push({
        updateFormInfo: {
          info: { 
            title: generatedForm.title,
            description: generatedForm.description 
          },
          updateMask: 'title,description'
        }
      });

      // If updating, we should handle items. For simplicity/safety, let's focus on Creation first
      // and maybe just append items if update? 
      // Actually, if editingFormId is present, we might want to clear old items.
      // But let's keep it simple for now: Always create a new form if using AI Builder, 
      // but if we "Edit" an existing one, we are using the same builder UI.

      // Add items
      generatedForm.items.forEach((item: any, index: number) => {
        const createItem: any = {
          createItem: {
            item: {
              title: item.title,
              questionItem: {
                question: {
                  required: item.required || false
                }
              }
            },
            location: { index }
          }
        };

        if (item.type === 'TEXT') {
          createItem.createItem.item.questionItem.question.textQuestion = { paragraph: true };
        } else if (item.type === 'CHOICE') {
          createItem.createItem.item.questionItem.question.choiceQuestion = {
            type: 'RADIO',
            options: item.options.map((o: string) => ({ value: o }))
          };
        } else if (item.type === 'CHECKBOX') {
          createItem.createItem.item.questionItem.question.choiceQuestion = {
            type: 'CHECKBOX',
            options: item.options.map((o: string) => ({ value: o }))
          };
        } else if (item.type === 'SCALE') {
          createItem.createItem.item.questionItem.question.scaleQuestion = {
            low: 1,
            high: 5
          };
        }

        requests.push(createItem);
      });

      const result = await updateFormBatch(accessToken, formId!, requests);
      setCreatedFormUrl(`https://docs.google.com/forms/d/${formId}/edit`);
      setGeneratedForm(null);
      setEditingFormId(null);
      setPrompt('');
    } catch (error) {
      console.error("Error saving Google Form:", error);
      alert("Failed to save form on Google. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  const updateItem = (id: string, updates: any) => {
    setGeneratedForm((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const removeItem = (id: string) => {
    setGeneratedForm((prev: any) => ({
      ...prev,
      items: prev.items.filter((item: any) => item.id !== id)
    }));
  };

  const addItem = () => {
    const newItem = {
      id: Math.random().toString(36).substring(7),
      title: 'New Question',
      type: 'TEXT',
      required: false
    };
    setGeneratedForm((prev: any) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const reorderItems = (newItems: any[]) => {
    setGeneratedForm((prev: any) => ({
      ...prev,
      items: newItems
    }));
  };

  const getAnswersForQuestion = (response: any, questionId: string): string[] => {
    const answer = response.answers?.[questionId];
    if (!answer || !answer.textAnswers || !answer.textAnswers.answers) {
      return [];
    }
    return answer.textAnswers.answers.map((a: any) => a.value || '').filter(Boolean);
  };

  const getChoiceCounts = (questionId: string, options: string[]) => {
    const counts: Record<string, number> = {};
    options.forEach(opt => { counts[opt] = 0; });
    
    formResponses.forEach(resp => {
      const vals = getAnswersForQuestion(resp, questionId);
      vals.forEach(val => {
        if (counts[val] !== undefined) {
          counts[val]++;
        } else {
          const key = options.find(o => o.toLowerCase() === val.toLowerCase());
          if (key) counts[key]++;
        }
      });
    });
    
    return counts;
  };

  const getScaleStats = (questionId: string) => {
    let sum = 0;
    let count = 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    formResponses.forEach(resp => {
      const vals = getAnswersForQuestion(resp, questionId);
      if (vals.length > 0) {
        const num = parseInt(vals[0], 10);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          distribution[num]++;
          sum += num;
          count++;
        }
      }
    });
    
    const average = count > 0 ? (sum / count).toFixed(1) : '0';
    return { average, distribution, count };
  };

  const getTextAnswersList = (questionId: string) => {
    const answers: string[] = [];
    formResponses.forEach(resp => {
      const vals = getAnswersForQuestion(resp, questionId);
      if (vals.length > 0) {
        answers.push(vals.join(', '));
      }
    });
    return answers;
  };

  // Render Responses Dashboard
  if (selectedFormForResponses) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
        {/* Back navigation & form meta */}
        <div className="mb-6">
          <button 
            type="button"
            onClick={() => setSelectedFormForResponses(null)}
            className="flex items-center space-x-2 text-sm font-semibold text-muted hover:text-foreground hover:bg-surface px-3 py-1.5 rounded-lg border border-border transition-all"
          >
            <ChevronLeft size={16} />
            <span>Back to Workspace Forms</span>
          </button>
        </div>

        {isResponsesLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted">
            <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
            <p className="text-sm font-semibold">Syncing real-time form structure and responses from Google Forms...</p>
          </div>
        ) : responsesError ? (
          <div className="p-8 bg-red-50/50 border border-red-200 rounded-xl max-w-2xl mx-auto text-center">
            <AlertCircle className="text-red-600 mx-auto mb-4" size={36} />
            <h3 className="text-lg font-bold text-red-900 mb-2">Sync Error</h3>
            <p className="text-sm text-red-700/80 mb-6">{responsesError}</p>
            <div className="flex gap-4 justify-center">
              <button 
                type="button"
                onClick={() => handleViewResponses(selectedFormForResponses)} 
                className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm active:scale-95"
              >
                Try Syncing Again
              </button>
              <button 
                type="button"
                onClick={() => setSelectedFormForResponses(null)} 
                className="border border-border bg-white px-6 py-2.5 rounded-xl font-bold hover:bg-surface text-foreground transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 animate-in fade-in duration-300"
          >
            {/* Form Title Card */}
            <div className="p-6 md:p-8 bg-surface border border-border/80 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest bg-purple-100 text-purple-700 ring-1 ring-purple-200">
                    Live Form Responses
                  </span>
                  <span className="text-xs font-semibold text-muted flex items-center gap-1">
                    <Users size={12} />
                    <span>{formResponses.length} total response{formResponses.length !== 1 && 's'}</span>
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-1">
                  {loadedFormStructure?.title || selectedFormForResponses.name}
                </h1>
                <p className="text-sm text-foreground-muted">
                  {loadedFormStructure?.description || "Visual aggregates and individual answers collected."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => handleViewResponses(selectedFormForResponses)}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-surface hover:bg-surface-hover border border-border text-foreground px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  title="Reload responses from Google Form"
                >
                  <RefreshCw size={14} />
                  <span>Refresh Data</span>
                </button>
                <a
                  href={selectedFormForResponses.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-foreground-hover transition-all"
                >
                  <ExternalLink size={14} />
                  <span>Live Form URL</span>
                </a>
              </div>
            </div>

            {/* Dashboard grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column - AI Summary Panel */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100 rounded-2xl shadow-sm p-6 space-y-6">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="text-indigo-600 shrink-0" size={18} />
                    <h3 className="font-extrabold text-indigo-950 text-sm tracking-wide uppercase">AI Insight Assistant</h3>
                  </div>
                  
                  <p className="text-xs text-indigo-900/80 leading-relaxed">
                    Let Google Gemini analyze the feedback trends, sentiment ratios, and formulate next steps and growth recommendations.
                  </p>

                  <button
                    type="button"
                    onClick={handleAnalyzeResponses}
                    disabled={formResponses.length === 0 || isAnalyzing}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-40"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Analyzing feedback...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Synthesize with AI</span>
                      </>
                    )}
                  </button>

                  <AnimatePresence mode="popLayout">
                    {aiAnalysis && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm space-y-4 max-h-[420px] overflow-y-auto selection:bg-indigo-100"
                      >
                        <div className="text-xs font-bold text-indigo-400 font-mono tracking-widest uppercase border-b border-indigo-50 pb-2">
                          Extracted AI Analysis
                        </div>
                        <div className="markdown-body text-xs text-indigo-950 leading-relaxed">
                          <Markdown>{aiAnalysis}</Markdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Column - Results Display Workspace */}
              <div className="lg:col-span-8 space-y-6">
                {/* Tabs to toggle Summary and Individuals */}
                <div className="flex justify-between items-center bg-surface border border-border p-1.5 rounded-xl">
                  <div className="flex space-x-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => setResponsesTab('summary')}
                      className={cn(
                        "flex-1 md:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-2",
                        responsesTab === 'summary' 
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                          : "text-muted hover:text-foreground"
                      )}
                    >
                      <BarChart3 size={14} />
                      <span>Summary Metrics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResponsesTab('individual');
                        if (selectedResponseIndex === null && formResponses.length > 0) {
                          setSelectedResponseIndex(0);
                        }
                      }}
                      className={cn(
                        "flex-1 md:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-2",
                        responsesTab === 'individual' 
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                          : "text-muted hover:text-foreground"
                      )}
                    >
                      <Users size={14} />
                      <span>Individual Records ({formResponses.length})</span>
                    </button>
                  </div>
                </div>

                {/* Tab content displays */}
                {formResponses.length === 0 ? (
                  <div className="text-center py-20 bg-surface/40 border border-dashed border-border rounded-2xl p-6">
                    <div className="inline-flex p-4 bg-purple-50 text-purple-600 rounded-full mb-4">
                      <Users size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">No responses collected</h3>
                    <p className="text-sm text-muted max-w-sm mx-auto leading-relaxed mb-6">
                      Your form has not received any submissions yet. Open the form in Google Forms and invite others to start receiving responses.
                    </p>
                    <a
                      href={selectedFormForResponses.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-foreground text-background px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-foreground-hover transition-all"
                    >
                      <span>Share Form Link</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : responsesTab === 'summary' ? (
                  <div className="space-y-6">
                    {loadedFormStructure?.items.map((item: any, idx: number) => {
                      return (
                        <div key={item.id} className="p-6 bg-surface border border-border/80 rounded-2xl space-y-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-extrabold text-muted tracking-widest uppercase">
                                Question #{idx + 1} • {item.type}
                              </span>
                              <h3 className="font-bold text-base text-foreground mt-1">
                                {item.title}
                                {item.required && <span className="text-red-500 ml-1">*</span>}
                              </h3>
                            </div>
                          </div>

                          {/* TEXT Type responses renderer */}
                          {item.type === 'TEXT' && (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {getTextAnswersList(item.id).map((ans, aIdx) => (
                                <div key={aIdx} className="p-3 bg-white border border-border/60 rounded-xl text-xs text-foreground leading-relaxed">
                                  {ans}
                                </div>
                              ))}
                              {getTextAnswersList(item.id).length === 0 && (
                                <div className="text-xs text-muted/60 italic">No answers written for this field.</div>
                              )}
                            </div>
                          )}

                          {/* CHOICE / CHECKBOX Type options aggregates */}
                          {(item.type === 'CHOICE' || item.type === 'CHECKBOX') && (
                            <div className="space-y-3.5">
                              {(() => {
                                const counts = getChoiceCounts(item.id, item.options || []);
                                
                                return item.options?.map((opt: string, optIdx: number) => {
                                  const count = counts[opt] || 0;
                                  const pct = ((count / formResponses.length) * 100).toFixed(0);
                                  
                                  return (
                                    <div key={optIdx} className="space-y-1.5">
                                      <div className="flex justify-between text-xs font-medium">
                                        <span className="text-foreground-muted">{opt}</span>
                                        <span className="text-foreground shrink-0 font-bold">{count} ({pct}%)</span>
                                      </div>
                                      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}

                          {/* SCALE Type Responses visual display */}
                          {item.type === 'SCALE' && (
                            <div className="space-y-4">
                              {(() => {
                                const stats = getScaleStats(item.id);
                                return (
                                  <>
                                    <div className="flex items-center space-x-4">
                                      <div className="bg-purple-50 text-purple-700 px-5 py-3 rounded-2xl border border-purple-100 flex flex-col items-center">
                                        <span className="text-3xl font-extrabold">{stats.average}</span>
                                        <span className="text-[9px] font-extrabold uppercase mt-1 text-purple-400">Average Rating</span>
                                      </div>
                                      <div className="text-xs text-muted">
                                        Based on {stats.count} scaling score response{stats.count !== 1 && 's'} submitted.
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {[5, 4, 3, 2, 1].map((num) => {
                                        const count = stats.distribution[num] || 0;
                                        const pct = stats.count > 0 ? ((count / stats.count) * 100).toFixed(0) : '0';
                                        return (
                                          <div key={num} className="flex items-center space-x-3 text-xs">
                                            <span className="w-3 text-muted/80 font-bold">{num}</span>
                                            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-purple-500 rounded-full"
                                                style={{ width: `${pct}%` }}
                                              />
                                            </div>
                                            <span className="w-12 text-right text-foreground font-semibold">{count} ({pct}%)</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Individual Records Workspace View */
                  <div className="flex flex-col md:flex-row border border-border rounded-2xl overflow-hidden bg-background">
                    {/* Left Responders Sidebar List */}
                    <div className="w-full md:w-56 border-r border-border bg-surface shrink-0 h-[450px] overflow-y-auto w-full md:border-b-0 border-b">
                      <div className="p-3 border-b border-border text-[9px] font-bold text-muted uppercase tracking-widest font-mono">
                        Submission Records
                      </div>
                      <div className="divide-y divide-border/60">
                        {formResponses.map((resp, respIdx) => {
                          const timeStr = new Date(resp.lastSubmittedTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
                          const emailStr = resp.respondentEmail || `Record #${respIdx + 1}`;
                          return (
                            <button
                              type="button"
                              key={resp.responseId}
                              onClick={() => setSelectedResponseIndex(respIdx)}
                              className={cn(
                                "w-full text-left p-3.5 transition-colors block text-xs",
                                selectedResponseIndex === respIdx 
                                  ? "bg-purple-50 border-r-4 border-purple-600 text-purple-950 font-semibold" 
                                  : "hover:bg-surface-hover text-foreground-muted"
                              )}
                            >
                              <div className="truncate font-medium">{emailStr}</div>
                              <div className="text-[10px] text-muted mt-1 font-mono">{timeStr}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Single Record Answers Display */}
                    <div className="flex-1 p-6 space-y-6 h-[450px] overflow-y-auto">
                      {selectedResponseIndex !== null && formResponses[selectedResponseIndex] ? (
                        <>
                          <div className="border-b border-border/80 pb-4">
                            <h4 className="text-xs font-extrabold text-purple-600 uppercase tracking-widest mb-1">
                              Submission Details
                            </h4>
                            <div className="text-sm font-extrabold text-foreground">
                              {formResponses[selectedResponseIndex].respondentEmail || `Record #${selectedResponseIndex + 1}`}
                            </div>
                            <div className="text-[10px] text-muted mt-1.5 font-mono">
                              Submitted on {new Date(formResponses[selectedResponseIndex].lastSubmittedTime).toLocaleString()}
                            </div>
                          </div>

                          <div className="space-y-4">
                            {loadedFormStructure?.items.map((item: any, qIdx: number) => {
                              const ansArr = getAnswersForQuestion(formResponses[selectedResponseIndex], item.id);
                              return (
                                <div key={item.id} className="p-4 bg-surface border border-border/60 rounded-xl space-y-1.5">
                                  <div className="text-[9px] font-bold text-muted uppercase tracking-wide">
                                    Question {qIdx + 1}
                                  </div>
                                  <div className="font-semibold text-xs text-foreground">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-purple-950 bg-white border border-purple-100 p-2.5 rounded-lg leading-relaxed whitespace-pre-line mt-2">
                                    {ansArr.join(', ') || <span className="text-muted/50 italic">Empty response</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted">
                          <Users size={32} className="mb-2" />
                          <p className="text-xs">Select a submission record from the left sidebar to inspect answers.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-foreground text-background rounded-lg">
                <ClipboardList size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Forms</h1>
                <p className="text-muted">Create and manage your Google Forms.</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 p-1 bg-surface-hover rounded-lg w-fit mb-8">
            <button
              onClick={() => setActiveTab('builder')}
              className={cn(
                "px-6 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === 'builder' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted hover:text-foreground"
              )}
            >
              AI Builder
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={cn(
                "px-6 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === 'management' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted hover:text-foreground"
              )}
            >
              My Forms
            </button>
          </div>
        </header>

        {activeTab === 'builder' ? (
          <>
            <section className="mb-8 max-w-4xl relative z-10">
              <AnimatePresence mode="popLayout">
                {!generatedForm && (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    onSubmit={handleGenerate} 
                    className="relative bg-surface border border-border/60 hover:border-border rounded-2xl shadow-sm hover:shadow-md transition-all p-2"
                  >
                    <textarea
                      id="form-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., Make a job applicant form for a Senior Product Designer role with questions about experience, portfolio link, and expected salary."
                      className="w-full h-32 p-4 bg-transparent border-none text-lg outline-none resize-none placeholder:text-muted/50"
                      disabled={isGenerating || isCreating}
                    />
                    <div className="flex justify-between items-center px-4 pb-2">
                       <span className="text-xs font-medium text-muted/60">AI will generate a complete Google Form structure</span>
                       <button
                         id="generate-button"
                         type="submit"
                         disabled={isGenerating || !prompt.trim() || isCreating}
                         className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm active:scale-95"
                       >
                         {isGenerating ? (
                           <>
                             <Loader2 className="animate-spin" size={18} />
                             <span>Generating...</span>
                           </>
                         ) : (
                           <>
                             <Sparkles size={18} />
                             <span>Generate Form</span>
                           </>
                         )}
                       </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </section>

            <div className="mb-12 max-w-4xl">
              <AnimatePresence>
                {generatedForm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -20 }}
                    className="bg-surface border border-border/80 rounded-2xl shadow-xl overflow-hidden ring-1 ring-border/50"
                  >
                    {/* AI Edit Bar */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-border p-4 flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex items-center space-x-2 text-indigo-700 font-medium whitespace-nowrap">
                        <Sparkles size={18} className="text-indigo-500" />
                        <span className="text-sm">Edit with AI</span>
                      </div>
                      <form onSubmit={handleEditWithAI} className="flex-1 flex items-center space-x-2 w-full">
                        <input
                          type="text"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="e.g., Add a question asking for their portfolio link..."
                          className="flex-1 bg-white border border-indigo-100 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-sm"
                          disabled={isEditingWithAI}
                        />
                        <button
                          type="submit"
                          disabled={isEditingWithAI || !editPrompt.trim()}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center space-x-2 shadow-sm active:scale-95"
                        >
                           {isEditingWithAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                           <span>Update</span>
                        </button>
                      </form>
                    </div>

                    <div className="p-8 border-b border-border bg-background/50">
                      <div className="flex justify-between items-start flex-col gap-6 md:flex-row mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                             {editingFormId && (
                               <button 
                                onClick={() => {
                                  setEditingFormId(null);
                                  setGeneratedForm(null);
                                }}
                                className="flex items-center space-x-1 text-xs font-semibold text-muted hover:text-foreground bg-surface px-2 py-1 rounded-md border border-border"
                               >
                                 <ChevronLeft size={14} />
                                 <span>Back to Builder</span>
                               </button>
                             )}
                             <span className={cn(
                               "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest",
                               editingFormId ? "bg-purple-100 text-purple-700 ring-1 ring-purple-200" : "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                             )}>
                               {editingFormId ? 'Editing Form' : 'AI Draft'}
                             </span>
                          </div>
                          <input
                            type="text"
                            value={generatedForm.title}
                            onChange={(e) => setGeneratedForm({ ...generatedForm, title: e.target.value })}
                            className="text-3xl font-extrabold tracking-tight text-foreground mb-2 bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-muted/40"
                            placeholder="Form Title"
                          />
                          <input
                            type="text"
                            value={generatedForm.description}
                            onChange={(e) => setGeneratedForm({ ...generatedForm, description: e.target.value })}
                            className="text-base text-muted/80 bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-muted/40"
                            placeholder="Form Description"
                          />
                        </div>
                        <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                          <button
                            onClick={handleCreateOnGoogle}
                            disabled={isCreating}
                            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-foreground text-background px-6 py-2.5 rounded-xl font-bold hover:bg-foreground-hover transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            {isCreating ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Send size={18} />
                            )}
                            <span>{editingFormId ? 'Save Changes' : 'Publish to Google'}</span>
                          </button>
                          <button
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-surface hover:bg-surface-hover border border-border/80 text-foreground px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95"
                          >
                            {isPreviewMode ? <EyeOff size={18} /> : <Eye size={18} />}
                            <span>{isPreviewMode ? 'Exit Preview' : 'Live Preview'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 md:p-8 bg-zinc-50/50">
                      {isPreviewMode ? (
                        <div className="space-y-8 max-w-2xl mx-auto font-sans">
                          <div className="p-6 bg-surface border border-border border-t-8 border-t-indigo-600 rounded-lg shadow-sm">
                            <h2 className="text-3xl font-bold text-foreground mb-2">{generatedForm.title}</h2>
                            <p className="text-foreground-muted">{generatedForm.description}</p>
                          </div>
                          
                          {generatedForm.items.map((item: any) => (
                            <div key={item.id} className="p-6 bg-surface border border-border rounded-lg shadow-sm">
                              <label className="block text-base font-medium text-foreground mb-4">
                                {item.title}
                                {item.required && <span className="text-destructive ml-1">*</span>}
                              </label>
                              
                              {item.type === 'TEXT' && (
                                <textarea 
                                  placeholder="Your answer"
                                  className="w-full bg-transparent border-b border-border focus:border-indigo-600 outline-none py-2 resize-none text-foreground placeholder:text-muted"
                                />
                              )}
                              
                              {(item.type === 'CHOICE' || item.type === 'CHECKBOX') && (
                                <div className="space-y-3">
                                  {item.options.map((opt: string, idx: number) => (
                                    <div key={idx} className="flex items-center space-x-3">
                                      <div className={cn(
                                        "w-4 h-4 border-2 border-border cursor-pointer",
                                        item.type === 'CHOICE' ? "rounded-full" : "rounded-sm"
                                      )} />
                                      <span className="text-foreground-muted">{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {item.type === 'SCALE' && (
                                <div className="flex items-center justify-between max-w-md mx-auto px-4">
                                  {[1, 2, 3, 4, 5].map((val) => (
                                    <div key={val} className="flex flex-col items-center space-y-2">
                                      <span className="text-xs text-muted font-medium">{val}</span>
                                      <div className="w-5 h-5 rounded-full border-2 border-border hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          <div className="flex justify-start">
                            <button className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700 transition-colors shadow-md">
                              Submit Form
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Reorder.Group
                            axis="y"
                            values={generatedForm.items}
                            onReorder={reorderItems}
                            className="space-y-4"
                          >
                            {generatedForm.items.map((item: any) => (
                              <Reorder.Item
                                key={item.id}
                                value={item}
                                className="relative group p-6 bg-white border border-border/60 hover:border-border rounded-xl shadow-sm hover:shadow-md transition-all"
                              >
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted p-1">
                                  <GripVertical size={20} />
                                </div>

                                <div className="ml-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 mr-4">
                                      <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                        className="font-semibold text-lg text-foreground bg-transparent border-none outline-none focus:ring-0 w-full"
                                        placeholder="Question Text"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <select
                                        value={item.type}
                                        onChange={(e) => updateItem(item.id, { type: e.target.value })}
                                        className="text-[10px] bg-surface-hover text-muted px-2 py-1 rounded font-bold uppercase tracking-wider border-none focus:ring-0 cursor-pointer"
                                      >
                                        <option value="TEXT">Text</option>
                                        <option value="CHOICE">Multiple Choice</option>
                                        <option value="CHECKBOX">Checkbox</option>
                                        <option value="SCALE">Scale</option>
                                      </select>
                                      <button
                                        onClick={() => updateItem(item.id, { required: !item.required })}
                                        className={cn(
                                          "text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors",
                                          item.required 
                                            ? "bg-red-100 text-red-700" 
                                            : "bg-surface-hover text-muted"
                                        )}
                                      >
                                        Required
                                      </button>
                                      <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-1 text-muted hover:text-red-600 transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>

                                  {(item.type === 'CHOICE' || item.type === 'CHECKBOX') && (
                                    <div className="space-y-2 mt-4 ml-2">
                                      {item.options?.map((opt: string, j: number) => (
                                        <div key={j} className="flex items-center space-x-3">
                                          <div className={cn("w-4 h-4 border-2 border-border", item.type === 'CHOICE' ? "rounded-full" : "rounded-sm")} />
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                              const newOptions = [...item.options];
                                              newOptions[j] = e.target.value;
                                              updateItem(item.id, { options: newOptions });
                                            }}
                                            className="text-sm bg-transparent border-none outline-none focus:ring-0 text-muted flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const newOptions = item.options.filter((_: any, idx: number) => idx !== j);
                                              updateItem(item.id, { options: newOptions });
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-opacity"
                                          >
                                            <X size={14} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const newOptions = [...(item.options || []), `Option ${(item.options?.length || 0) + 1}`];
                                          updateItem(item.id, { options: newOptions });
                                        }}
                                        className="text-xs text-muted hover:text-foreground flex items-center space-x-1 mt-2 font-medium"
                                      >
                                        <Plus size={12} />
                                        <span>Add Option</span>
                                      </button>
                                    </div>
                                  )}

                                  {item.type === 'SCALE' && (
                                    <div className="flex items-center space-x-4 mt-4 ml-6">
                                      {[1, 2, 3, 4, 5].map((val) => (
                                        <div key={val} className="flex flex-col items-center space-y-1">
                                          <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-xs text-muted">{val}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>

                          <button
                            onClick={addItem}
                            className="w-full mt-6 py-4 border-2 border-dashed border-border rounded-xl text-muted hover:text-foreground hover:border-border-strong transition-all flex items-center justify-center space-x-2 font-medium"
                          >
                            <Plus size={18} />
                            <span>Add New Question</span>
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {createdFormUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 p-8 rounded-xl flex flex-col items-center justify-center text-center shadow-lg"
                >
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-green-900 mb-2">Form Successfully Created!</h2>
                  <p className="text-green-700 mb-8 max-w-md">Your Google Form is ready. You can now edit questions, adjust settings, and start collecting responses.</p>
                  
                  <div className="flex space-x-4">
                    <a
                      id="open-form-button"
                      href={createdFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-all shadow-md group"
                    >
                      <span>Open in Google Forms</span>
                      <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search forms by name..."
                  value={formSearchQuery}
                  onChange={(e) => setFormSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg outline-none focus:border-border-strong text-sm transition-all"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-surface border border-border rounded-lg p-1">
                  <button 
                    onClick={() => setFormSortBy('name')}
                    className={cn(
                      "px-3 py-1 text-xs rounded-md font-medium transition-all",
                      formSortBy === 'name' ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                    )}
                  >
                    Name
                  </button>
                  <button 
                    onClick={() => setFormSortBy('modifiedTime')}
                    className={cn(
                      "px-3 py-1 text-xs rounded-md font-medium transition-all",
                      formSortBy === 'modifiedTime' ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                    )}
                  >
                    Date
                  </button>
                </div>

                <button 
                  onClick={() => setFormSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-surface border border-border rounded-lg text-muted hover:text-foreground transition-all"
                  title={formSortOrder === 'asc' ? "Sort Descending" : "Sort Ascending"}
                >
                  {formSortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                </button>

                <button 
                  onClick={loadUserForms}
                  disabled={isLoadingForms}
                  className="p-2 bg-surface border border-border rounded-lg text-muted hover:text-foreground transition-all disabled:opacity-50"
                  title="Refresh List"
                >
                  <Clock size={18} className={isLoadingForms ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {isLoadingForms ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Loading your forms...</p>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-24 bg-surface/30 border border-dashed border-border rounded-xl">
                <div className="inline-flex p-4 bg-surface rounded-full mb-4">
                   <ClipboardList size={32} className="text-muted" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">No forms found</h3>
                <p className="text-muted">
                  {formSearchQuery ? "No forms match your search." : "You haven't created any forms yet."}
                </p>
                {!formSearchQuery && (
                  <button 
                    onClick={() => setActiveTab('builder')}
                    className="mt-6 text-foreground font-semibold flex items-center space-x-2 mx-auto hover:underline"
                  >
                    <span>Create your first form</span>
                    <Plus size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredForms.map((form) => (
                  <div key={form.id} className="group bg-surface border border-border rounded-xl p-5 hover:border-border-strong transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                        <ClipboardList size={20} />
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => handleDeleteForm(form.id)}
                          className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <a 
                          href={form.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-muted hover:text-foreground hover:bg-background rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 truncate pr-4" title={form.name}>
                      {form.name}
                    </h3>
                    <p className="text-xs text-muted flex items-center">
                      <Clock size={12} className="mr-1" />
                      Modified {new Date(form.modifiedTime).toLocaleDateString()}
                    </p>
                    
                    <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4 flex-wrap gap-2">
                       <button 
                        onClick={() => handleEditExistingForm(form.id)}
                        className="text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground flex items-center space-x-1 transition-all"
                       >
                         <span>View & Edit</span>
                         <ArrowRight size={12} />
                       </button>

                       <button 
                        onClick={() => handleViewResponses(form)}
                        className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-600 hover:text-purple-700 hover:bg-purple-50/50 px-2.5 py-1.5 rounded-md flex items-center space-x-1 transition-all border border-purple-100/50"
                       >
                         <BarChart3 size={13} />
                         <span>Responses</span>
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
  );
}

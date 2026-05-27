import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Clock, 
  LayoutGrid, 
  Presentation, 
  ArrowRight, 
  ExternalLink,
  CheckCircle2,
  GripVertical,
  ChevronLeft,
  Eye,
  EyeOff,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Send,
  X,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  Upload,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchRecentDriveFiles, 
  deleteDriveFile, 
  createGooglePresentation, 
  updatePresentationBatch,
  uploadBase64ImageToDrive
} from '../lib/googleApi';
import { 
  generatePresentationStructure, 
  editPresentationStructureWithAI,
  summarizePresentation,
  askPresentationQuestion
} from '../lib/gemini';
import { cn } from '../lib/utils';

export function Slides() {
  const { accessToken, signIn } = useAuth();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'builder' | 'management'>('builder');

  // Preview Mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Builder/Editor State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdSlidesUrl, setCreatedSlidesUrl] = useState<string | null>(null);

  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingWithAI, setIsEditingWithAI] = useState(false);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);

  // AI Analysis & Insights
  const [isInsightPanelOpen, setIsInsightPanelOpen] = useState(false);
  const [analysisMessages, setAnalysisMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Management State
  const [userSlides, setUserSlides] = useState<any[]>([]);
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);
  const [slidesSearchQuery, setSlidesSearchQuery] = useState('');
  const [slidesSortBy, setSlidesSortBy] = useState<'name' | 'modifiedTime' | 'createdTime'>('modifiedTime');
  const [slidesSortOrder, setSlidesSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch when switching to management tab
  useEffect(() => {
    if (activeTab === 'management' && accessToken) {
      loadUserSlides();
    }
  }, [activeTab, accessToken, slidesSortBy, slidesSortOrder]);

  const loadUserSlides = async () => {
    setIsLoadingSlides(true);
    try {
      const slides = await fetchRecentDriveFiles(
        accessToken!, 
        "mimeType = 'application/vnd.google-apps.presentation' and trashed = false",
        `${slidesSortBy} ${slidesSortOrder}`
      );
      setUserSlides(slides);
    } catch (error) {
      console.error("Error loading slides:", error);
    } finally {
      setIsLoadingSlides(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setCreatedSlidesUrl(null);
    try {
      const structure = await generatePresentationStructure(prompt);
      // Unique IDs for reordering
      const structureWithIds = {
        ...structure,
        slides: structure.slides.map((slide: any) => ({
          ...slide,
          id: Math.random().toString(36).substring(7)
        }))
      };
      setGeneratedSlides(structureWithIds);
    } catch (error) {
      console.error("Error generating slides:", error);
      alert("Failed to generate presentation structure. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !generatedSlides) return;

    setIsEditingWithAI(true);
    try {
      const updatedStructure = await editPresentationStructureWithAI(generatedSlides, editPrompt);
      const structureWithIds = {
        ...updatedStructure,
        slides: updatedStructure.slides.map((slide: any) => ({
          ...slide,
          id: slide.id || Math.random().toString(36).substring(7)
        }))
      };
      setGeneratedSlides(structureWithIds);
      setEditPrompt('');
    } catch (error) {
      console.error("Error editing slides:", error);
      alert("Failed to edit presentation. Please try again.");
    } finally {
      setIsEditingWithAI(false);
    }
  };

  const handleCreateOnGoogle = async () => {
    if (!accessToken || !generatedSlides) return;

    setIsCreating(true);
    try {
      // 1. Create presentation shell
      const presentation = await createGooglePresentation(accessToken, generatedSlides.title);
      const presentationId = presentation.presentationId;

      // 2. Prepare slides requests
      const requests: any[] = [];
      const theme = generatedSlides.theme || {
        primaryColor: "#1a365d",
        secondaryColor: "#2b6cb0",
        accentColor: "#ed8936"
      };

      // Helper to convert hex to RGB for Slides API (0-1 range)
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { red: r, green: g, blue: b };
      };

      const primaryRgb = hexToRgb(theme.primaryColor);

      for (let index = 0; index < generatedSlides.slides.length; index++) {
        const slide = generatedSlides.slides[index];
        const isTitleSlide = index === 0 || slide.layout === 'TITLE';
        const isMarketAnalysis = slide.layout === 'MARKET_ANALYSIS';
        const hasImage = !!slide.image;

        const slideId = `slide_${index}_${Math.random().toString(36).substring(7)}`;
        const titleId = `title_${index}_${Math.random().toString(36).substring(7)}`;
        const bodyId = `body_${index}_${Math.random().toString(36).substring(7)}`;
        const dividerId = `divider_${index}_${Math.random().toString(36).substring(7)}`;
        const bgShapeId = `bg_${index}_${Math.random().toString(36).substring(7)}`;
        const footerId = `footer_${index}_${Math.random().toString(36).substring(7)}`;
        
        // Create the slide (BLANK layout)
        requests.push({
          createSlide: {
            objectId: slideId,
            insertionIndex: index,
            slideLayoutReference: { predefinedLayout: 'BLANK' }
          }
        });

        // Add a vertical brand bar on the left for a premium look
        requests.push({
          createShape: {
            objectId: bgShapeId,
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageObjectId: slideId,
              size: { width: { magnitude: 15, unit: 'PT' }, height: { magnitude: 405, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: 'PT' }
            }
          }
        });
        requests.push({
          updateShapeProperties: {
            objectId: bgShapeId,
            shapeProperties: {
              shapeBackgroundFill: { solidFill: { color: { rgbColor: primaryRgb } } },
              outline: { outlineFill: { solidFill: { color: { rgbColor: primaryRgb } } } }
            },
            fields: 'shapeBackgroundFill,outline'
          }
        });

        // Add Divider (Not for Title Slide)
        if (!isTitleSlide) {
          requests.push({
            createShape: {
              objectId: dividerId,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slideId,
                size: { width: { magnitude: 600, unit: 'PT' }, height: { magnitude: 2, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 60, translateY: 95, unit: 'PT' }
              }
            }
          });
          requests.push({
            updateShapeProperties: {
              objectId: dividerId,
              shapeProperties: {
                shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } } } },
                outline: { outlineFill: { solidFill: { color: { rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } } } } }
              },
              fields: 'shapeBackgroundFill,outline'
            }
          });
        }

        // Add Title Shape
        requests.push({
          createShape: {
            objectId: titleId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: { 
                width: { magnitude: 600, unit: 'PT' }, 
                height: { magnitude: isTitleSlide ? 120 : 60, unit: 'PT' } 
              },
              transform: { 
                scaleX: 1, scaleY: 1, 
                translateX: 60, 
                translateY: isTitleSlide ? 120 : 40, 
                unit: 'PT' 
              }
            }
          }
        });
        requests.push({
          insertText: { objectId: titleId, text: slide.title, insertionIndex: 0 }
        });
        requests.push({
          updateTextStyle: {
            objectId: titleId,
            style: {
              fontSize: { magnitude: isTitleSlide ? 44 : 28, unit: 'PT' },
              bold: true,
              fontFamily: 'Arial',
              foregroundColor: { opaqueColor: { rgbColor: primaryRgb } }
            },
            fields: 'fontSize,bold,fontFamily,foregroundColor'
          }
        });

        // Add Footer
        requests.push({
          createShape: {
            objectId: footerId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: { width: { magnitude: 600, unit: 'PT' }, height: { magnitude: 20, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 60, translateY: 380, unit: 'PT' }
            }
          }
        });
        requests.push({
          insertText: { objectId: footerId, text: `${generatedSlides.title.toUpperCase()} | © ${new Date().getFullYear()} Strategic Intelligence`, insertionIndex: 0 }
        });
        requests.push({
          updateTextStyle: {
            objectId: footerId,
            style: {
              fontSize: { magnitude: 8, unit: 'PT' },
              fontFamily: 'Arial',
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.6, green: 0.6, blue: 0.6 } } },
              bold: true
            },
            fields: 'fontSize,fontFamily,foregroundColor,bold'
          }
        });

        // Add Body Shape (Not for Title Slide if no content)
        if (!isTitleSlide || (Array.isArray(slide.content) && slide.content.length > 0)) {
          requests.push({
            createShape: {
              objectId: bodyId,
              shapeType: 'TEXT_BOX',
              elementProperties: {
                pageObjectId: slideId,
                size: { 
                  width: { magnitude: (isMarketAnalysis || hasImage) ? 320 : 600, unit: 'PT' }, 
                  height: { magnitude: 260, unit: 'PT' } 
                },
                transform: { 
                  scaleX: 1, scaleY: 1, 
                  translateX: 60, 
                  translateY: isTitleSlide ? 240 : 120, 
                  unit: 'PT' 
                }
              }
            }
          });

          const contentText = Array.isArray(slide.content) ? slide.content.join('\n\n') : slide.content;
          requests.push({
            insertText: { objectId: bodyId, text: contentText, insertionIndex: 0 }
          });
          requests.push({
            updateTextStyle: {
              objectId: bodyId,
              style: {
                fontSize: { magnitude: isTitleSlide ? 16 : 13, unit: 'PT' },
                fontFamily: 'Arial',
                foregroundColor: { opaqueColor: { rgbColor: { red: 0.2, green: 0.2, blue: 0.2 } } }
              },
              fields: 'fontSize,fontFamily,foregroundColor'
            }
          });
        }

        // Handle Images
        if (hasImage) {
          try {
            const driveUrl = await uploadBase64ImageToDrive(accessToken, slide.image, `slide_image_${index}.png`);
            if (driveUrl) {
              requests.push({
                createImage: {
                  url: driveUrl,
                  elementProperties: {
                    pageObjectId: slideId,
                    size: { width: { magnitude: 240, unit: 'PT' }, height: { magnitude: 240, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 420, translateY: 120, unit: 'PT' }
                  }
                }
              });
            }
          } catch (imgError) {
            console.error("Failed to process image for slide:", index, imgError);
          }
        } else if (isMarketAnalysis) {
          const calloutId = `callout_${index}_${Math.random().toString(36).substring(7)}`;
          const calloutTextId = `calloutText_${index}_${Math.random().toString(36).substring(7)}`;
          
          requests.push({
            createShape: {
              objectId: calloutId,
              shapeType: 'ROUND_RECTANGLE',
              elementProperties: {
                pageObjectId: slideId,
                size: { width: { magnitude: 240, unit: 'PT' }, height: { magnitude: 240, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 420, translateY: 120, unit: 'PT' }
              }
            }
          });
          
          requests.push({
            updateShapeProperties: {
              objectId: calloutId,
              shapeProperties: {
                shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.97, green: 0.98, blue: 0.99 } } } },
                outline: { dashStyle: 'SOLID', weight: { magnitude: 2, unit: 'PT' }, outlineFill: { solidFill: { color: { rgbColor: primaryRgb } } } }
              },
              fields: 'shapeBackgroundFill,outline'
            }
          });

          // Callout Title
          requests.push({
            createShape: {
              objectId: calloutTextId,
              shapeType: 'TEXT_BOX',
              elementProperties: {
                pageObjectId: slideId,
                size: { width: { magnitude: 200, unit: 'PT' }, height: { magnitude: 100, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 440, translateY: 140, unit: 'PT' }
              }
            }
          });
          requests.push({
            insertText: { objectId: calloutTextId, text: "KEY MARKET METRICS\n\nStrategic insights based on AI analysis of current trends and project data.", insertionIndex: 0 }
          });
          requests.push({
            updateTextStyle: {
              objectId: calloutTextId,
              style: {
                fontSize: { magnitude: 12, unit: 'PT' },
                fontFamily: 'Arial',
                foregroundColor: { opaqueColor: { rgbColor: primaryRgb } },
                bold: true
              },
              fields: 'fontSize,fontFamily,foregroundColor,bold'
            }
          });
        }
      }

      await updatePresentationBatch(accessToken, presentationId, requests);

      setCreatedSlidesUrl(`https://docs.google.com/presentation/d/${presentationId}/edit`);
      setGeneratedSlides(null);
      setPrompt('');
    } catch (error) {
      console.error("Error creating Google Presentation:", error);
      alert("Failed to create presentation on Google. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSlides = async (fileId: string) => {
    if (!window.confirm('Delete this presentation?')) return;
    try {
      await deleteDriveFile(accessToken!, fileId);
      setUserSlides(prev => prev.filter(s => s.id !== fileId));
    } catch (error) {
      console.error("Error deleting presentation:", error);
    }
  };

  const updateSlide = (id: string, updates: any) => {
    setGeneratedSlides((prev: any) => ({
      ...prev,
      slides: prev.slides.map((s: any) => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const removeSlide = (id: string) => {
    setGeneratedSlides((prev: any) => ({
      ...prev,
      slides: prev.slides.filter((s: any) => s.id !== id)
    }));
  };

  const handleGenerateImage = async (slideId: string, prompt: string) => {
    setGeneratingImageId(slideId);
    try {
      // Logic for AI generation could be added here
      alert(`AI is imagining: ${prompt}\n(In this preview, we show the prompt. In production, this would generate a custom asset.)`);
    } finally {
      setGeneratingImageId(null);
    }
  };

  const handleImageUpload = (slideId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateSlide(slideId, { image: event.target?.result as string, imagePrompt: `Uploaded: ${file.name}` });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (slideId: string) => {
    updateSlide(slideId, { image: undefined, imagePrompt: undefined });
  };

  const handleSummarize = async () => {
    if (!generatedSlides) return;
    setIsAnalyzing(true);
    try {
      const summary = await summarizePresentation(generatedSlides.slides);
      setAnalysisMessages(prev => [...prev, { role: 'model', content: summary }]);
    } catch (error) {
      console.error("Error summarizing:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !generatedSlides) return;

    const userMsg = chatInput;
    setChatInput('');
    setAnalysisMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAnalyzing(true);

    try {
      const response = await askPresentationQuestion(
        generatedSlides.slides,
        userMsg,
        analysisMessages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
      );
      setAnalysisMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      console.error("Error in Q&A:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reorderSlides = (newSlides: any[]) => {
    setGeneratedSlides((prev: any) => ({
      ...prev,
      slides: newSlides
    }));
  };

  const filteredSlides = userSlides.filter(s => 
    s.name.toLowerCase().includes(slidesSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      <header className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <Presentation size={24} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Google Slides Intelligence</h1>
        </div>
        <p className="text-muted text-lg">Generate professional presentations with AI and manage your slides.</p>
      </header>

      {!accessToken ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Presentation size={32} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Connect Google Account</h2>
          <p className="text-muted mb-8 max-w-md mx-auto">
            To generate and manage Google Slides, you need to sign in with your Google account.
          </p>
          <button 
            onClick={() => signIn()}
            className="bg-foreground text-background px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center space-x-2 mx-auto"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex space-x-1 bg-surface p-1 rounded-xl w-fit border border-border shadow-sm">
            <button
              onClick={() => setActiveTab('builder')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center space-x-2",
                activeTab === 'builder' ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
              )}
            >
              <LayoutGrid size={18} />
              <span>Presentation Builder</span>
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center space-x-2",
                activeTab === 'management' ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
              )}
            >
              <Clock size={18} />
              <span>My Slides</span>
            </button>
          </div>

          {activeTab === 'builder' ? (
            <>
              <section className="mb-8 max-w-4xl relative z-10">
                <AnimatePresence mode="popLayout">
                  {!generatedSlides && (
                    <motion.form 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      onSubmit={handleGenerate} 
                      className="relative bg-surface border border-border/60 hover:border-border rounded-2xl shadow-sm hover:shadow-md transition-all p-2"
                    >
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A 10-slide pitch deck for a sustainable fashion startup including market analysis and growth strategy..."
                        className="w-full h-32 p-4 bg-transparent border-none text-lg outline-none resize-none placeholder:text-muted/50"
                        disabled={isGenerating || isCreating}
                      />
                      <div className="flex justify-between items-center px-4 pb-2">
                        <span className="text-xs font-medium text-muted/60">AI will generate a visual presentation for you</span>
                        <button 
                          disabled={isGenerating || !prompt.trim()}
                          className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm active:scale-95"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={18} />
                              <span>Generate Deck</span>
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
                  {generatedSlides && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -20 }}
                      className="bg-surface border border-border/80 rounded-2xl shadow-xl overflow-hidden ring-1 ring-border/50"
                    >
                      {/* AI Edit Bar */}
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-border p-4 flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex items-center space-x-2 text-orange-700 font-medium whitespace-nowrap">
                          <Sparkles size={18} className="text-orange-500" />
                          <span className="text-sm">Edit with AI</span>
                        </div>
                        <form onSubmit={handleEditWithAI} className="flex-1 flex items-center space-x-2 w-full">
                          <input
                            type="text"
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="e.g., Add a slide about competitor analysis..."
                            className="flex-1 bg-white border border-orange-100 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 transition-all shadow-sm"
                            disabled={isEditingWithAI}
                          />
                          <button
                            type="submit"
                            disabled={isEditingWithAI || !editPrompt.trim()}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center space-x-2 shadow-sm active:scale-95"
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
                              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-orange-100 text-orange-700 ring-1 ring-orange-200 uppercase tracking-widest">
                                AI Deck Draft
                              </span>
                            </div>
                            <input 
                              type="text"
                              value={generatedSlides.title}
                              onChange={(e) => setGeneratedSlides({ ...generatedSlides, title: e.target.value })}
                              className="text-3xl font-extrabold tracking-tight text-foreground mb-2 bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-muted/40"
                              placeholder="Presentation Title"
                            />
                          </div>
                          <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                            <button
                              onClick={() => setIsInsightPanelOpen(true)}
                              className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-orange-100 border border-orange-200 text-orange-700 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 hover:bg-orange-200/50"
                            >
                              <MessageSquare size={18} />
                              <span>AI Insights</span>
                            </button>
                            <button
                              onClick={handleCreateOnGoogle}
                              disabled={isCreating}
                              className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-foreground text-background px-6 py-2.5 rounded-xl font-bold hover:bg-foreground-hover transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                              {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                              <span>Publish to Slides</span>
                            </button>
                            <button
                              onClick={() => setIsPreviewMode(!isPreviewMode)}
                              className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-surface hover:bg-surface-hover border border-border/80 text-foreground px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95"
                            >
                              {isPreviewMode ? <EyeOff size={18} /> : <Eye size={18} />}
                              <span>{isPreviewMode ? 'Exit Preview' : 'Interactive Preview'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 md:p-8 bg-zinc-50/50">
                        {isPreviewMode ? (
                          <div className="space-y-8 max-w-4xl mx-auto font-sans">
                            {generatedSlides.slides.map((slide: any, idx: number) => (
                              <div key={slide.id} className="aspect-video bg-white border border-border/60 rounded-xl p-8 md:p-12 shadow-md flex flex-col relative overflow-hidden">
                                {slide.layout === 'MARKET_ANALYSIS' ? (
                                  <div className="h-full flex flex-col">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-orange-100 pb-4 tracking-tight flex items-center gap-2">
                                      <LayoutGrid className="text-orange-500" size={24} />
                                      {slide.title}
                                    </h2>
                                    <div className="grid grid-cols-2 gap-6 flex-1">
                                      <div className="space-y-4">
                                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Market Insights</p>
                                          <div className="space-y-3">
                                            {Array.isArray(slide.content) ? slide.content.map((point: string, i: number) => (
                                              <div key={i} className="flex items-start space-x-2 text-gray-700 text-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                                <p className="leading-tight">{point}</p>
                                              </div>
                                            )) : <p className="text-gray-700 text-sm leading-relaxed">{slide.content}</p>}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="relative rounded-xl overflow-hidden bg-zinc-50 border border-border/40 flex items-center justify-center p-4">
                                        {slide.image ? (
                                          <img src={slide.image} alt="Slide Visual" className="w-full h-full object-contain" />
                                        ) : (
                                          <div className="text-center">
                                            <ImageIcon size={48} className="text-zinc-200 mx-auto mb-2" />
                                            <p className="text-[10px] text-zinc-400 font-medium px-4">{slide.imagePrompt}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-zinc-50 flex justify-between items-center text-[10px] text-muted font-bold uppercase tracking-wider">
                                       <span className="flex items-center gap-1"><AlertCircle size={10}/> Strategic Analysis</span>
                                       <span>Slide {idx + 1}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {(slide.imagePrompt || slide.image) && (
                                      <div className="absolute top-0 right-0 w-1/3 h-full bg-zinc-50 border-l border-border/50 flex items-center justify-center p-4">
                                         {slide.image ? (
                                           <img src={slide.image} alt="Slide Visual" className="w-full h-full object-contain" />
                                         ) : (
                                           <div className="text-center">
                                             <ImageIcon size={32} className="text-zinc-300 mx-auto mb-2" />
                                             <p className="text-[10px] text-zinc-400 italic">Visual: {slide.imagePrompt}</p>
                                           </div>
                                         )}
                                      </div>
                                    )}
                                    <div className={(slide.imagePrompt || slide.image) ? "w-2/3 pr-8 flex flex-col h-full" : "w-full flex flex-col h-full"}>
                                      <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-orange-100 pb-4 tracking-tight">{slide.title}</h2>
                                      <div className="space-y-4">
                                        {Array.isArray(slide.content) ? slide.content.map((point: string, i: number) => (
                                          <div key={i} className="flex items-start space-x-3 text-gray-700 text-lg">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2.5 shrink-0" />
                                            <p className="leading-tight">{point}</p>
                                          </div>
                                        )) : <p className="text-gray-700 text-lg leading-relaxed">{slide.content}</p>}
                                      </div>
                                      <div className="mt-auto pt-8 flex justify-between items-center text-[10px] text-muted font-bold uppercase tracking-wider">
                                        <span>{generatedSlides.title}</span>
                                        <span>Slide {idx + 1}</span>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Reorder.Group axis="y" values={generatedSlides.slides} onReorder={reorderSlides} className="space-y-4">
                            {generatedSlides.slides.map((slide: any) => (
                              <Reorder.Item 
                                key={slide.id} 
                                value={slide} 
                                className="group relative p-6 bg-white border border-border/60 hover:border-border rounded-xl shadow-sm hover:shadow-md transition-all"
                              >
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted p-1">
                                  <GripVertical size={20} />
                                </div>
                                <div className="ml-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                      <input 
                                         type="text"
                                         value={slide.title}
                                         onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                                         className="font-bold text-xl text-foreground bg-transparent border-none outline-none focus:ring-0 w-full mb-1"
                                         placeholder="Slide Title"
                                      />
                                      <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-1 text-[10px] font-bold text-muted/60 uppercase tracking-wider">
                                          <LayoutGrid size={10} />
                                          <select 
                                            value={slide.layout}
                                            onChange={(e) => updateSlide(slide.id, { layout: e.target.value })}
                                            className="bg-transparent border-none focus:ring-0 p-0 text-[10px] uppercase font-bold"
                                          >
                                            <option value="TITLE">Title Only</option>
                                            <option value="TITLE_AND_BODY">Title & Body</option>
                                            <option value="MAIN_POINT">Impact Slide</option>
                                            <option value="MARKET_ANALYSIS">Market Analysis</option>
                                          </select>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <label className="flex items-center space-x-2 text-[10px] font-bold text-blue-600/60 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors bg-blue-50/50 px-2 py-1 rounded">
                                            <Upload size={10} />
                                            <span>{slide.image ? 'Replace' : 'Upload'}</span>
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              className="hidden" 
                                              onChange={(e) => handleImageUpload(slide.id, e)}
                                            />
                                          </label>
                                          {slide.image && (
                                            <button 
                                              onClick={() => handleRemoveImage(slide.id)}
                                              className="flex items-center space-x-1 text-[10px] font-bold text-red-600/60 uppercase tracking-wider hover:text-red-600 transition-colors bg-red-50/50 px-2 py-1 rounded"
                                            >
                                              <Trash2 size={10} />
                                              <span>Remove</span>
                                            </button>
                                          )}
                                          {slide.imagePrompt && !slide.image && (
                                            <div className="flex items-center space-x-1 text-[10px] font-bold text-orange-600/60 uppercase tracking-wider">
                                              <ImageIcon size={10} />
                                              <span>AI Suggestion</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <button onClick={() => removeSlide(slide.id)} className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                  <textarea 
                                    value={Array.isArray(slide.content) ? slide.content.join('\n') : slide.content}
                                    onChange={(e) => updateSlide(slide.id, { content: e.target.value.split('\n') })}
                                    className="w-full bg-transparent border-none focus:ring-0 text-muted text-sm min-h-[100px] resize-none"
                                    placeholder="Slide content (points)..."
                                  />
                                  {slide.imagePrompt && (
                                    <div className="mt-4 p-3 bg-orange-50/50 rounded-lg border border-orange-100 flex items-center justify-between gap-4">
                                      <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-1">Image Prompt</label>
                                        <input 
                                          type="text"
                                          value={slide.imagePrompt}
                                          onChange={(e) => updateSlide(slide.id, { imagePrompt: e.target.value })}
                                          className="w-full bg-transparent border-none focus:ring-0 text-xs text-orange-800"
                                        />
                                      </div>
                                      <button 
                                        onClick={() => handleGenerateImage(slide.id, slide.imagePrompt)}
                                        disabled={generatingImageId === slide.id}
                                        className="p-2 bg-orange-200/50 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors shrink-0"
                                        title="Visualize with AI"
                                      >
                                        {generatingImageId === slide.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Insight Panel Overlay */}
                <AnimatePresence>
                  {isInsightPanelOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsInsightPanelOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
                      />
                      <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-border shadow-2xl z-50 flex flex-col"
                      >
                        <div className="p-6 border-b border-border flex items-center justify-between bg-orange-50/50">
                          <div>
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                              <Sparkles className="text-orange-500" size={18} />
                              AI Presentation Insight
                            </h3>
                            <p className="text-xs text-muted">Analyze, summarize, and ask about your deck.</p>
                          </div>
                          <button onClick={() => setIsInsightPanelOpen(false)} className="p-2 hover:bg-white rounded-lg transition-colors">
                            <X size={18} />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {analysisMessages.length === 0 && (
                            <div className="text-center py-12">
                              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText size={24} />
                              </div>
                              <h4 className="font-bold text-foreground mb-2">Get Started</h4>
                              <p className="text-sm text-muted mb-6">Ask me to summarize your slides or answer specific industrial questions based on the content.</p>
                              <button 
                                onClick={handleSummarize}
                                disabled={isAnalyzing}
                                className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-all flex items-center space-x-2 mx-auto"
                              >
                                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                <span>Summarize Entire Deck</span>
                              </button>
                            </div>
                          )}

                          {analysisMessages.map((msg, i) => (
                            <div key={i} className={cn(
                              "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                              msg.role === 'user' 
                                ? "bg-foreground text-background ml-auto rounded-tr-none" 
                                : "bg-white border border-border text-foreground mr-auto rounded-tl-none prose prose-sm prose-orange"
                            )}>
                              {msg.content}
                            </div>
                          ))}
                          {isAnalyzing && (
                            <div className="bg-white border border-border p-4 rounded-2xl mr-auto rounded-tl-none animate-pulse flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" />
                              </div>
                              <span className="text-xs text-muted font-medium italic">Analyzing content...</span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-background border-t border-border">
                          <form onSubmit={handleSendMessage} className="relative">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Ask about your market analysis..."
                              className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                            />
                            <button
                              type="submit"
                              disabled={!chatInput.trim() || isAnalyzing}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50"
                            >
                              <Send size={16} />
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {createdSlidesUrl && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 bg-orange-50 border border-orange-200 p-8 rounded-2xl text-center">
                    <CheckCircle2 size={48} className="text-orange-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-orange-900 mb-2">Presentation Created!</h3>
                    <p className="text-orange-700 mb-6">Your Google Slides deck is ready to use.</p>
                    <a href={createdSlidesUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 bg-orange-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-700 transition-all">
                      <span>Open in Google Slides</span>
                      <ExternalLink size={20} />
                    </a>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input 
                    type="text"
                    placeholder="Search presentations..."
                    value={slidesSearchQuery}
                    onChange={(e) => setSlidesSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg outline-none focus:border-border-strong text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                   <select 
                    value={slidesSortBy} 
                    onChange={(e) => setSlidesSortBy(e.target.value as any)}
                    className="text-xs bg-surface border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                   >
                     <option value="name">Sort by Name</option>
                     <option value="modifiedTime">Sort by Date</option>
                   </select>
                   <button 
                    onClick={() => setSlidesSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2 bg-surface border border-border rounded-lg text-muted hover:text-foreground"
                   >
                     {slidesSortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                   </button>
                   <button onClick={loadUserSlides} className="p-2 bg-surface border border-border rounded-lg text-muted hover:text-foreground">
                     <Clock size={18} className={isLoadingSlides ? "animate-spin" : ""} />
                   </button>
                </div>
              </div>

              {isLoadingSlides ? (
                <div className="flex flex-col items-center py-24 text-muted">
                  <Loader2 className="animate-spin mb-4" size={32} />
                  <p>Loading your presentations...</p>
                </div>
              ) : filteredSlides.length === 0 ? (
                <div className="text-center py-24 bg-surface/30 border border-dashed border-border rounded-2xl">
                  <Presentation size={48} className="text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No slides found</h3>
                  <p className="text-muted">Try a different search or create a new deck.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSlides.map((slide) => (
                    <div key={slide.id} className="group bg-surface border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:border-orange-200">
                      <div className="aspect-video bg-orange-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-orange-100">
                        {slide.thumbnailLink ? (
                          <img src={slide.thumbnailLink} alt={slide.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Presentation size={48} className="text-orange-200" />
                        )}
                      </div>
                      <h3 className="font-bold text-foreground mb-1 truncate">{slide.name}</h3>
                      <p className="text-xs text-muted mb-6">Last modified {new Date(slide.modifiedTime).toLocaleDateString()}</p>
                      
                      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleDeleteSlides(slide.id)} className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                        <a href={slide.webViewLink} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-wider text-orange-600 hover:text-orange-700 flex items-center space-x-1">
                          <span>Open Slides</span>
                          <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
